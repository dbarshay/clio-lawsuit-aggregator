import { NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(value: any): number {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function cleanText(value: any): string {
  return String(value ?? "").trim();
}

function cleanDate(value: any): string {
  const raw = String(value || "").trim();

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [mm, dd, yyyy] = raw.split("/");
    return `${mm}.${dd}.${yyyy}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-");
    return `${mm}.${dd}.${yyyy}`;
  }

  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}.${yyyy}`;
}

function cleanOptionalDate(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return cleanDate(raw);
}

function paymentReceiptView(row: any) {
  const safetySnapshot = row?.safetySnapshot || {};
  const posting = safetySnapshot?.posting || {};

  const transactionType = cleanText(row?.transactionType || posting.transactionType);
  const transactionStatus = cleanText(row?.transactionStatus || posting.transactionStatus);
  const transactionDate = cleanText(row?.transactionDate || posting.transactionDate || row?.paymentDate);
  const checkNumber = cleanText(row?.checkNumber || posting.checkNumber);
  const checkDate = cleanText(row?.checkDate || posting.checkDate);
  const invoiceId = cleanText(row?.invoiceId || posting.invoiceId);
  const description = cleanText(row?.description || posting.description || transactionType);
  const transactionFee = row?.transactionFee ?? posting.transactionFee ?? null;
  const postedBy = cleanText(row?.postedBy || posting.postedBy || safetySnapshot.sourceOfPaymentIntent || "Barsh Matters UI");
  const posted = typeof row?.posted === "boolean" ? row.posted : !!row?.createdAt;

  return {
    ...row,
    transactionType,
    transactionStatus,
    transactionDate,
    checkNumber,
    checkDate,
    invoiceId,
    description,
    transactionFee,
    postedBy,
    posted,
  };
}

function cfId(cfv: any): number {
  return Number(cfv?.custom_field?.id ?? cfv?.custom_field_id ?? cfv?.custom_field);
}

function findCfv(matter: any, fieldId: number) {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];
  return rows.find((row: any) => cfId(row) === Number(fieldId));
}

function payloadForExistingCfv(cfv: any, fieldId: number, value: number) {
  if (!cfv?.id) {
    throw new Error(
      `Missing existing Clio custom field value record for field ${fieldId}.  Refusing to create a new custom field value record.`
    );
  }

  return {
    id: cfv.id,
    value: value.toFixed(2),
  };
}

async function clioJson(path: string, init?: RequestInit): Promise<any> {
  const response = await clioFetch(path, init);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error?.message ||
        json?.error ||
        `Clio request failed with status ${response.status}`
    );
  }

  return json;
}

async function refreshClaimIndexBestEffort(matterIdInput: string) {
  try {
    const matterId = Number(matterIdInput);

    if (!Number.isFinite(matterId) || matterId <= 0) {
      return {
        ok: false,
        error: `Invalid matterId for ClaimIndex refresh: ${matterIdInput}`,
      };
    }

    const mod: any = await import("@/lib/indexMatterInternal");
    const fn = mod.indexMatterInternal || mod.default;

    if (typeof fn === "function") {
      await fn(matterId, { force: true });
      return { ok: true, method: "indexMatterInternal", matterId };
    }

    return { ok: false, error: "indexMatterInternal export not found" };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || String(error),
    };
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matterId = Number(url.searchParams.get("matterId") || "");

    if (!Number.isFinite(matterId) || matterId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valid matterId is required." },
        { status: 400 }
      );
    }

    const rows = await prisma.matterPaymentReceipt.findMany({
      where: { matterId },
      orderBy: [
        { paymentDate: "desc" },
        { createdAt: "desc" },
      ],
      take: 25,
    });

    return NextResponse.json({
      ok: true,
      matterId,
      count: rows.length,
      rows: rows.map(paymentReceiptView),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const matterId = String(body?.matterId || "").trim();
    const paymentAmount = num(body?.paymentAmount);
    const paymentDate = cleanDate(body?.paymentDate);
    const transactionType = cleanText(body?.transactionType);
    const transactionStatus = cleanText(body?.transactionStatus);
    const checkDate = cleanOptionalDate(body?.checkDate);
    const checkNumber = cleanText(body?.checkNumber);
    const expectedDisplayNumber = String(body?.expectedDisplayNumber || "").trim();

    if (!matterId) {
      return NextResponse.json(
        { ok: false, error: "matterId is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Payment amount must be greater than $0.00." },
        { status: 400 }
      );
    }

    const fields =
      "id,display_number,custom_field_values{id,value,custom_field}";

    const readBeforeJson: any = await clioJson(
      `/api/v4/matters/${encodeURIComponent(matterId)}.json?fields=${fields}`
    );

    const matterBefore = readBeforeJson?.data;

    if (!matterBefore?.id) {
      return NextResponse.json(
        { ok: false, error: "Could not read matter from Clio before payment writeback." },
        { status: 502 }
      );
    }

    if (
      expectedDisplayNumber &&
      String(matterBefore.display_number || "").trim() !== expectedDisplayNumber
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Matter display number mismatch.  Refusing payment writeback.",
          expectedDisplayNumber,
          actualDisplayNumber: matterBefore.display_number || "",
        },
        { status: 409 }
      );
    }

    const claimAmountCfv = findCfv(matterBefore, MATTER_CF.CLAIM_AMOUNT);
    const paymentVoluntaryCfv = findCfv(matterBefore, MATTER_CF.PAYMENT_VOLUNTARY);
    const balancePresuitCfv = findCfv(matterBefore, MATTER_CF.BALANCE_PRESUIT);

    const claimAmount = num(claimAmountCfv?.value);
    const currentPaymentVoluntary = num(paymentVoluntaryCfv?.value);
    const rawBalancePresuit = num(balancePresuitCfv?.value);
    const calculatedBalancePresuit = Math.max(claimAmount - currentPaymentVoluntary, 0);

    const currentBalancePresuit =
      rawBalancePresuit > 0 || calculatedBalancePresuit === 0
        ? rawBalancePresuit
        : calculatedBalancePresuit;

    if (paymentAmount > currentBalancePresuit) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payment amount exceeds the current Balance Presuit.",
          claimAmount,
          currentPaymentVoluntary,
          rawBalancePresuit,
          calculatedBalancePresuit,
          currentBalancePresuit,
          paymentAmount,
        },
        { status: 400 }
      );
    }

    const newPaymentVoluntary = currentPaymentVoluntary + paymentAmount;
    const newBalancePresuit = Math.max(currentBalancePresuit - paymentAmount, 0);

    const customFieldValues = [
      payloadForExistingCfv(
        paymentVoluntaryCfv,
        MATTER_CF.PAYMENT_VOLUNTARY,
        newPaymentVoluntary
      ),
      payloadForExistingCfv(
        balancePresuitCfv,
        MATTER_CF.BALANCE_PRESUIT,
        newBalancePresuit
      ),
    ];

    const writeResultJson: any = await clioJson(
      `/api/v4/matters/${encodeURIComponent(matterId)}.json`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            custom_field_values: customFieldValues,
          },
        }),
      }
    );

    const readAfterJson: any = await clioJson(
      `/api/v4/matters/${encodeURIComponent(matterId)}.json?fields=${fields}`
    );

    const readbackPaymentVoluntary = num(
      findCfv(readAfterJson?.data, MATTER_CF.PAYMENT_VOLUNTARY)?.value
    );
    const readbackBalancePresuit = num(
      findCfv(readAfterJson?.data, MATTER_CF.BALANCE_PRESUIT)?.value
    );

    const refreshedIndex = await refreshClaimIndexBestEffort(matterId);

    const receipt = await prisma.matterPaymentReceipt.create({
      data: {
        matterId: Number(matterId),
        displayNumber: matterBefore.display_number || "",
        paymentDate,
        paymentAmount,
        transactionType,
        transactionStatus,
        transactionDate: paymentDate,
        checkDate,
        checkNumber,
        invoiceId: "",
        description: transactionType,
        transactionFee: null,
        postedBy: "Barsh Matters UI",
        posted: true,
        claimAmountBefore: claimAmount,
        paymentVoluntaryBefore: currentPaymentVoluntary,
        balancePresuitBefore: currentBalancePresuit,
        paymentVoluntaryAfter: readbackPaymentVoluntary,
        balancePresuitAfter: readbackBalancePresuit,
        clioReadback: {
          paymentVoluntary: readbackPaymentVoluntary,
          balancePresuit: readbackBalancePresuit,
        },
        safetySnapshot: {
          sourceOfPaymentIntent: "Barsh Matters UI",
          systemOfRecordAfterWriteback: "Clio readback",
          customFieldValueCreation: "blocked",
          clioWriteConfirmed: !!writeResultJson?.data?.id,
          posting: {
            transactionType,
            transactionStatus,
            transactionDate: paymentDate,
            checkDate,
            checkNumber,
            invoiceId: "",
            description: transactionType,
            transactionFee: null,
            postedBy: "Barsh Matters UI",
            posted: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      action: "apply-payment",
      matterId,
      displayNumber: matterBefore.display_number || "",
      paymentDate,
      paymentApplied: paymentAmount,
      before: {
        claimAmount,
        paymentVoluntary: currentPaymentVoluntary,
        balancePresuit: currentBalancePresuit,
      },
      after: {
        claimAmount,
        paymentVoluntary: readbackPaymentVoluntary,
        balancePresuit: readbackBalancePresuit,
      },
      receipt: paymentReceiptView(receipt),
      clioWriteConfirmed: !!writeResultJson?.data?.id,
      clioReadback: {
        paymentVoluntary: readbackPaymentVoluntary,
        balancePresuit: readbackBalancePresuit,
      },
      refreshedIndex,
      safety: {
        sourceOfPaymentIntent: "Barsh Matters UI",
        systemOfRecordAfterWriteback: "Clio readback",
        customFieldValueCreation: "blocked",
        receiptRecordedLocally: true,
        balanceSourceForDirectPayment:
          rawBalancePresuit > 0 || calculatedBalancePresuit === 0
            ? "clio-balance-presuit"
            : "claim-amount-minus-payment-voluntary-fallback",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
