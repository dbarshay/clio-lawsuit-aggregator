import { NextRequest, NextResponse } from "next/server";
import { assertValidClaimNumberWrite } from "@/lib/claimNumberGuard";
import { clioFetch } from "@/lib/clio";
import { indexMatterInternal } from "@/lib/indexMatterInternal";

const CLAIM_NUMBER_FIELD_ID = 22145915;

const ALLOWED_REPAIRS: Record<number, string> = {
  1871742125: "123456", // BRL30012
  1868749340: "123456", // BRL30003
};

function isValidClaimNumber(v: string) {
  return /^[A-Za-z0-9\-_/]+$/.test(v) && !/^\d{2}\.\d{4}\.\d{5}$/.test(v);
}

export async function GET(req: NextRequest) {
  const apply = req.nextUrl.searchParams.get("apply") === "true";

  const results = [];

  for (const [matterIdRaw, correctedClaim] of Object.entries(ALLOWED_REPAIRS)) {
    const matterId = Number(matterIdRaw);

    assertValidClaimNumberWrite(correctedClaim);

    if (!isValidClaimNumber(correctedClaim)) {
      results.push({
        matterId,
        status: "SKIPPED_INVALID_CORRECTED_CLAIM",
        correctedClaim,
      });
      continue;
    }

    const fields = "id,display_number,custom_field_values{id,value,custom_field}";
    const res = await clioFetch(
      `/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
    );

    if (!res.ok) {
      results.push({
        matterId,
        status: "ERROR_FETCHING_MATTER",
        error: await res.text(),
      });
      continue;
    }

    const json = await res.json();
    const matter = json?.data;
    const cfv = matter?.custom_field_values || [];

    const claimValue = cfv.find(
      (v: any) => Number(v?.custom_field?.id) === CLAIM_NUMBER_FIELD_ID
    );

    if (!claimValue?.id) {
      results.push({
        matterId,
        displayNumber: matter?.display_number,
        status: "SKIPPED_NO_EXISTING_CLAIM_CFV",
      });
      continue;
    }

    const before = claimValue.value ?? null;

    if (!apply) {
      results.push({
        matterId,
        displayNumber: matter?.display_number,
        status: "DRY_RUN_WOULD_UPDATE",
        before,
        after: correctedClaim,
        claimCustomFieldValueId: claimValue.id,
      });
      continue;
    }

    const patch = await clioFetch(`/matters/${matterId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          custom_field_values: [
            {
              custom_field: { id: CLAIM_NUMBER_FIELD_ID },
              value: correctedClaim,
            },
          ],
        },
      }),
    });

    if (!patch.ok) {
      results.push({
        matterId,
        displayNumber: matter?.display_number,
        status: "ERROR_UPDATING_CLAIM",
        before,
        after: correctedClaim,
        error: await patch.text(),
      });
      continue;
    }

    const indexed = await indexMatterInternal(matterId, { force: true });

    results.push({
      matterId,
      displayNumber: matter?.display_number,
      status: "UPDATED",
      before,
      after: correctedClaim,
      claimCustomFieldValueId: claimValue.id,
      reindexed: indexed,
    });
  }

  return NextResponse.json({
    ok: true,
    apply,
    count: results.length,
    results,
  });
}
