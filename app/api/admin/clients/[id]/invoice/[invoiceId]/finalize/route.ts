import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function intId(value: unknown): number | null {
  const text = clean(value);
  if (!/^\d+$/.test(text)) return null;
  const numeric = Number(text);
  return Number.isSafeInteger(numeric) ? numeric : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; invoiceId: string }> | { id: string; invoiceId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const clientId = clean(resolvedParams.id);
    const invoiceId = clean(resolvedParams.invoiceId);

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "Provider/client id is required." }, { status: 400 });
    }

    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: "Invoice id is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    if (body?.confirmFinalizeInvoice !== true) {
      return NextResponse.json(
        { ok: false, error: "confirmFinalizeInvoice must be true to finalize this invoice." },
        { status: 400 }
      );
    }

    const invoice = await prisma.providerClientInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice was not found." }, { status: 404 });
    }

    const belongsToClient =
      invoice.referenceEntityId === clientId ||
      invoice.providerClientInfoId === clientId ||
      clean((invoice.clientSnapshot as any)?.id) === clientId;

    if (!belongsToClient) {
      return NextResponse.json(
        { ok: false, error: "Invoice does not belong to this provider/client." },
        { status: 404 }
      );
    }

    const isReceiptMarkRepair = invoice.status === "finalized" && Boolean(invoice.finalizedAt);

    if (invoice.status !== "draft" && !isReceiptMarkRepair) {
      return NextResponse.json(
        { ok: false, error: `Only draft invoices can be finalized. Current status: ${invoice.status}` },
        { status: 409 }
      );
    }

    if (invoice.finalizedAt && !isReceiptMarkRepair) {
      return NextResponse.json(
        { ok: false, error: "Invoice is already finalized." },
        { status: 409 }
      );
    }

    if (!invoice.lines.length) {
      return NextResponse.json(
        { ok: false, error: "Invoice cannot be finalized without invoice lines." },
        { status: 400 }
      );
    }

    const receiptIds = Array.from(
      new Set(
        invoice.lines
          .filter((line) => line.sourceTable === "MatterPaymentReceipt")
          .map((line) => intId(line.sourceId))
          .filter((value): value is number => value !== null)
      )
    );

    const finalizedAt = new Date();
    const unmarkedReceiptWhere = {
      id: { in: receiptIds },
      OR: [{ invoiceId: null }, { invoiceId: "" }],
    };

    const unmarkedReceiptCount = receiptIds.length
      ? await prisma.matterPaymentReceipt.count({ where: unmarkedReceiptWhere })
      : 0;

    if (isReceiptMarkRepair && unmarkedReceiptCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Invoice is already finalized and included payment receipt rows are already marked." },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInvoice = isReceiptMarkRepair
        ? await tx.providerClientInvoice.findUnique({
            where: { id: invoice.id },
            include: { lines: true },
          })
        : await tx.providerClientInvoice.update({
            where: { id: invoice.id },
            data: {
              status: "finalized",
              finalizedAt,
            },
            include: { lines: true },
          });

      if (!updatedInvoice) throw new Error("Invoice was not found during finalization.");

      const receiptUpdate = receiptIds.length
        ? await tx.matterPaymentReceipt.updateMany({
            where: unmarkedReceiptWhere,
            data: { invoiceId: invoice.id },
          })
        : { count: 0 };

      return {
        invoice: updatedInvoice,
        receiptRowsMarkedWithThisInvoiceId: receiptUpdate.count,
        receiptLineSourceIds: receiptIds,
        isReceiptMarkRepair,
      };
    });

    return NextResponse.json({
      ok: true,
      action: "provider-client-invoice-finalize",
      mode: result.isReceiptMarkRepair ? "local-finalized-receipt-mark-repair" : "local-finalized",
      safety: "Finalized a local invoice only. This route marks included MatterPaymentReceipt rows with invoiceId, treating null and empty invoiceId as unmarked, but does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.",
      invoice: result.invoice,
      verification: {
        lineCount: result.invoice.lines.length,
        receiptLineSourceIds: result.receiptLineSourceIds,
        receiptRowsMarkedWithThisInvoiceId: result.receiptRowsMarkedWithThisInvoiceId,
        isDraft: result.invoice.status === "draft",
        isFinalized: Boolean(result.invoice.finalizedAt) && result.invoice.status === "finalized",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not finalize invoice." },
      { status: 500 }
    );
  }
}
