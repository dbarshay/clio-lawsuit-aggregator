import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Severity = "critical" | "warning" | "info";
type AuditStatus = "pass" | "review";

type LawsuitAuditRow = {
  id: number;
  masterLawsuitId: string;
  claimNumber: string | null;
  lawsuitMatters: string;
  venue: string | null;
  venueSelection: string | null;
  venueOther: string | null;
  indexAaaNumber: string | null;
  amountSoughtMode: string;
  amountSought: number | null;
  customAmountSought: number | null;
  clioMasterMatterId: number | null;
  clioMasterDisplayNumber: string | null;
  clioMasterMappedAt: Date | null;
  clioMasterMappingSource: string | null;
  createdAt: Date;
  updatedAt: Date;
  finalStatus?: string;
  closeReason?: string;
  parsedChildMatterIds?: number[];
  parsedChildDisplayNumbers?: string[];
  linkedClaimIndexChildCount?: number;
  issue_detail?: string;
};

type ClaimIndexChildRow = {
  matter_id: number;
  display_number: string | null;
  patient_name: string | null;
  provider_name: string | null;
  client_name: string | null;
  insurer_name: string | null;
  claim_number_raw: string | null;
  claim_amount: number | null;
  balance_amount: number | null;
  final_status: string | null;
  close_reason: string | null;
  master_lawsuit_id: string | null;
};

type AuditCheck = {
  id: string;
  label: string;
  severity: Severity;
  status: AuditStatus;
  count: number;
  description: string;
  sampleRows: LawsuitAuditRow[];
  sampleChildRows?: ClaimIndexChildRow[];
};

type CountBucket = {
  label: string;
  count: number;
};

const SAMPLE_LIMIT = 25;

const LAWSUIT_AUDIT_SELECT = {
  id: true,
  masterLawsuitId: true,
  claimNumber: true,
  lawsuitMatters: true,
  venue: true,
  venueSelection: true,
  venueOther: true,
  indexAaaNumber: true,
  lawsuitOptions: true,
  amountSoughtMode: true,
  amountSought: true,
  customAmountSought: true,
  amountSoughtBreakdown: true,
  clioMasterMatterId: true,
  clioMasterDisplayNumber: true,
  clioMasterMappedAt: true,
  clioMasterMappingSource: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LawsuitSelect;

const CLAIM_INDEX_CHILD_SELECT = {
  matter_id: true,
  display_number: true,
  patient_name: true,
  provider_name: true,
  client_name: true,
  insurer_name: true,
  claim_number_raw: true,
  claim_amount: true,
  balance_amount: true,
  final_status: true,
  close_reason: true,
  master_lawsuit_id: true,
} satisfies Prisma.ClaimIndexSelect;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function bucketLabel(value: unknown): string {
  return clean(value) || "(blank)";
}

function lawsuitOptionsObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function lawsuitFinalStatus(options: Prisma.JsonValue | null): string {
  const obj = lawsuitOptionsObject(options);
  return clean(obj.finalStatus ?? obj.final_status);
}

function lawsuitCloseReason(options: Prisma.JsonValue | null): string {
  const obj = lawsuitOptionsObject(options);
  return clean(obj.closeReason ?? obj.close_reason);
}

function normalizeLawsuit(row: Prisma.LawsuitGetPayload<{ select: typeof LAWSUIT_AUDIT_SELECT }>): LawsuitAuditRow {
  const finalStatus = lawsuitFinalStatus(row.lawsuitOptions);
  const closeReason = lawsuitCloseReason(row.lawsuitOptions);
  return {
    id: row.id,
    masterLawsuitId: row.masterLawsuitId,
    claimNumber: row.claimNumber,
    lawsuitMatters: row.lawsuitMatters,
    venue: row.venue,
    venueSelection: row.venueSelection,
    venueOther: row.venueOther,
    indexAaaNumber: row.indexAaaNumber,
    amountSoughtMode: row.amountSoughtMode,
    amountSought: row.amountSought,
    customAmountSought: row.customAmountSought,
    clioMasterMatterId: row.clioMasterMatterId,
    clioMasterDisplayNumber: row.clioMasterDisplayNumber,
    clioMasterMappedAt: row.clioMasterMappedAt,
    clioMasterMappingSource: row.clioMasterMappingSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    finalStatus,
    closeReason,
    parsedChildMatterIds: parseMatterIds(row.lawsuitMatters),
    parsedChildDisplayNumbers: parseMatterDisplayNumbers(row.lawsuitMatters),
  };
}

function withDetail(row: LawsuitAuditRow, issue_detail: string): LawsuitAuditRow {
  return { ...row, issue_detail };
}

function parseMatterIds(value: unknown): number[] {
  const text = clean(value);
  if (!text) return [];

  const ids = new Set<number>();

  function add(value: unknown) {
    const n = Number(value);
    if (Number.isInteger(n) && n > 0) ids.add(n);
  }

  function walk(value: unknown) {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      add(obj.matterId);
      add(obj.matter_id);
      add(obj.id);
      add(obj.clioMatterId);
      add(obj.clio_matter_id);
      for (const nested of Object.values(obj)) {
        if (Array.isArray(nested)) walk(nested);
      }
    }
  }

  try {
    walk(JSON.parse(text));
  } catch {
    // Non-JSON lawsuitMatters are parsed below by conservative token matching.
  }

  for (const match of text.matchAll(/\b(?:matterId|matter_id|clioMatterId|clio_matter_id|id)\D{0,12}(\d{6,})\b/gi)) {
    add(match[1]);
  }

  if (!ids.size) {
    for (const match of text.matchAll(/\b(\d{7,})\b/g)) {
      add(match[1]);
    }
  }

  return [...ids].sort((a, b) => a - b);
}

function parseMatterDisplayNumbers(value: unknown): string[] {
  const text = clean(value);
  if (!text) return [];

  const displayNumbers = new Set<string>();

  function add(value: unknown) {
    const display = clean(value).toUpperCase();
    if (/^BRL\d+$/.test(display)) displayNumbers.add(display);
  }

  function walk(value: unknown) {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      add(value);
      return;
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      add(obj.displayNumber);
      add(obj.display_number);
      add(obj.clioDisplayNumber);
      add(obj.clio_display_number);
      add(obj.matterDisplayNumber);
      add(obj.matter_display_number);
      for (const nested of Object.values(obj)) {
        if (Array.isArray(nested) || (nested && typeof nested === "object")) walk(nested);
      }
    }
  }

  try {
    walk(JSON.parse(text));
  } catch {
    // Non-JSON lawsuitMatters are parsed below by display-number token matching.
  }

  for (const match of text.matchAll(/\bBRL\d+\b/gi)) {
    add(match[0]);
  }

  return [...displayNumbers].sort();
}

function masterPatternOk(value: string): boolean {
  return /^\d{4}\.\d{2}\.\d{5}$/.test(clean(value));
}

function addCheck(checks: AuditCheck[], config: Omit<AuditCheck, "status">) {
  checks.push({
    ...config,
    status: config.count > 0 ? "review" : "pass",
    sampleRows: config.sampleRows.slice(0, SAMPLE_LIMIT),
    sampleChildRows: config.sampleChildRows?.slice(0, SAMPLE_LIMIT),
  });
}

function countBuckets(values: string[]): CountBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = bucketLabel(value);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function GET() {
  try {
    const now = new Date();

    const [lawsuitRows, linkedClaimIndexRows] = await Promise.all([
      prisma.lawsuit.findMany({
        select: LAWSUIT_AUDIT_SELECT,
        orderBy: { masterLawsuitId: "asc" },
      }),
      prisma.claimIndex.findMany({
        where: {
          NOT: [
            { master_lawsuit_id: null },
            { master_lawsuit_id: "" },
          ],
        },
        select: CLAIM_INDEX_CHILD_SELECT,
        orderBy: [{ master_lawsuit_id: "asc" }, { matter_id: "asc" }],
      }),
    ]);

    const lawsuits = lawsuitRows.map(normalizeLawsuit);
    const checks: AuditCheck[] = [];

    const lawsuitsByMaster = new Map(lawsuits.map((row) => [clean(row.masterLawsuitId), row]));
    const childrenByMaster = new Map<string, ClaimIndexChildRow[]>();

    for (const row of linkedClaimIndexRows) {
      const master = clean(row.master_lawsuit_id);
      if (!master) continue;
      const list = childrenByMaster.get(master) || [];
      list.push(row);
      childrenByMaster.set(master, list);
    }

    for (const row of lawsuits) {
      row.linkedClaimIndexChildCount = childrenByMaster.get(clean(row.masterLawsuitId))?.length || 0;
    }

    const missingMasterId = lawsuits.filter((row) => !clean(row.masterLawsuitId));
    addCheck(checks, {
      id: "missing-master-lawsuit-id",
      label: "Missing masterLawsuitId",
      severity: "critical",
      count: missingMasterId.length,
      description: "A local Lawsuit row must have a masterLawsuitId for grouping, restore review, and document-generation context.",
      sampleRows: missingMasterId,
    });

    const malformedMasterId = lawsuits.filter((row) => clean(row.masterLawsuitId) && !masterPatternOk(row.masterLawsuitId));
    addCheck(checks, {
      id: "malformed-master-lawsuit-id",
      label: "masterLawsuitId outside YYYY.MM.##### pattern",
      severity: "warning",
      count: malformedMasterId.length,
      description: "This flags local lawsuit IDs that do not match the current Barsh Matters master-lawsuit numbering convention.",
      sampleRows: malformedMasterId,
    });

    const missingLawsuitMatters = lawsuits.filter((row) => !clean(row.lawsuitMatters));
    addCheck(checks, {
      id: "missing-lawsuit-matters",
      label: "Missing lawsuitMatters",
      severity: "critical",
      count: missingLawsuitMatters.length,
      description: "lawsuitMatters should preserve the selected child-matter membership snapshot.",
      sampleRows: missingLawsuitMatters,
    });

    const noParsedChildren = lawsuits.filter(
      (row) =>
        clean(row.lawsuitMatters) &&
        !(row.parsedChildMatterIds || []).length &&
        !(row.parsedChildDisplayNumbers || []).length
    );
    addCheck(checks, {
      id: "lawsuit-matters-no-parseable-child-ids",
      label: "lawsuitMatters has no parseable child matter IDs",
      severity: "warning",
      count: noParsedChildren.length,
      description: "This is a conservative parser check. It flags lawsuitMatters text that may not contain recoverable child matter IDs for restore confidence.",
      sampleRows: noParsedChildren,
    });

    const noLinkedClaimIndexChildren = lawsuits.filter((row) => (row.linkedClaimIndexChildCount || 0) === 0);
    addCheck(checks, {
      id: "local-lawsuit-without-linked-claimindex-children",
      label: "Local Lawsuit has no linked ClaimIndex children",
      severity: "critical",
      count: noLinkedClaimIndexChildren.length,
      description: "A local master lawsuit should normally have child ClaimIndex rows linked by master_lawsuit_id.",
      sampleRows: noLinkedClaimIndexChildren,
    });

    const claimIndexLinkedToMissingMaster = linkedClaimIndexRows.filter(
      (row) => clean(row.master_lawsuit_id) && !lawsuitsByMaster.has(clean(row.master_lawsuit_id))
    );

    addCheck(checks, {
      id: "claimindex-child-linked-to-missing-lawsuit",
      label: "ClaimIndex child linked to missing local Lawsuit",
      severity: "critical",
      count: claimIndexLinkedToMissingMaster.length,
      description: "Every ClaimIndex child master_lawsuit_id should resolve to a local Lawsuit.masterLawsuitId.",
      sampleRows: [],
      sampleChildRows: claimIndexLinkedToMissingMaster,
    });

    const parsedChildIdsMissingLinkedClaimIndex: LawsuitAuditRow[] = [];
    for (const lawsuit of lawsuits) {
      const linkedRows = childrenByMaster.get(clean(lawsuit.masterLawsuitId)) || [];
      const linkedIds = new Set(linkedRows.map((row) => row.matter_id));
      const linkedDisplayNumbers = new Set(linkedRows.map((row) => clean(row.display_number).toUpperCase()).filter(Boolean));
      const missingIds = (lawsuit.parsedChildMatterIds || []).filter((id) => !linkedIds.has(id));
      const missingDisplayNumbers = (lawsuit.parsedChildDisplayNumbers || []).filter((displayNumber) => !linkedDisplayNumbers.has(clean(displayNumber).toUpperCase()));
      if (missingIds.length || missingDisplayNumbers.length) {
        parsedChildIdsMissingLinkedClaimIndex.push(
          withDetail(
            lawsuit,
            [
              missingIds.length ? `Parsed child matter ID(s) not linked in ClaimIndex: ${missingIds.slice(0, 20).join(", ")}` : "",
              missingDisplayNumbers.length ? `Parsed child display number(s) not linked in ClaimIndex: ${missingDisplayNumbers.slice(0, 20).join(", ")}` : "",
            ].filter(Boolean).join(" | ")
          )
        );
      }
    }

    addCheck(checks, {
      id: "lawsuit-matters-child-not-linked-in-claimindex",
      label: "lawsuitMatters child IDs not linked in ClaimIndex",
      severity: "critical",
      count: parsedChildIdsMissingLinkedClaimIndex.length,
      description: "Child matter IDs preserved in lawsuitMatters should also be linked in ClaimIndex.master_lawsuit_id.",
      sampleRows: parsedChildIdsMissingLinkedClaimIndex,
    });

    const linkedClaimIndexNotInParsedLawsuitMatters: LawsuitAuditRow[] = [];
    for (const lawsuit of lawsuits) {
      const parsedIds = new Set(lawsuit.parsedChildMatterIds || []);
      const parsedDisplayNumbers = new Set((lawsuit.parsedChildDisplayNumbers || []).map((displayNumber) => clean(displayNumber).toUpperCase()).filter(Boolean));
      const linkedRows = childrenByMaster.get(clean(lawsuit.masterLawsuitId)) || [];
      if (!parsedIds.size && !parsedDisplayNumbers.size) continue;
      const extraLinked = linkedRows.filter(
        (row) =>
          !parsedIds.has(row.matter_id) &&
          !parsedDisplayNumbers.has(clean(row.display_number).toUpperCase())
      );
      if (extraLinked.length) {
        linkedClaimIndexNotInParsedLawsuitMatters.push(
          withDetail(
            lawsuit,
            `ClaimIndex linked child ID(s) not found in parsed lawsuitMatters: ${extraLinked
              .slice(0, 20)
              .map((row) => row.matter_id)
              .join(", ")}`
          )
        );
      }
    }

    addCheck(checks, {
      id: "claimindex-linked-child-not-in-lawsuit-matters",
      label: "ClaimIndex linked children not found in lawsuitMatters",
      severity: "warning",
      count: linkedClaimIndexNotInParsedLawsuitMatters.length,
      description: "When lawsuitMatters is parseable, linked ClaimIndex children should match the local lawsuit membership snapshot.",
      sampleRows: linkedClaimIndexNotInParsedLawsuitMatters,
    });

    const invalidAmountSoughtMode = lawsuits.filter(
      (row) => !["balance_presuit", "claim_amount", "custom"].includes(clean(row.amountSoughtMode))
    );
    addCheck(checks, {
      id: "invalid-amount-sought-mode",
      label: "Invalid amountSoughtMode",
      severity: "critical",
      count: invalidAmountSoughtMode.length,
      description: "amountSoughtMode should be balance_presuit, claim_amount, or custom.",
      sampleRows: invalidAmountSoughtMode,
    });

    const customAmountMissing = lawsuits.filter(
      (row) => clean(row.amountSoughtMode) === "custom" && !(Number(row.customAmountSought) > 0)
    );
    addCheck(checks, {
      id: "custom-amount-mode-missing-custom-amount",
      label: "Custom amount mode missing customAmountSought",
      severity: "critical",
      count: customAmountMissing.length,
      description: "Custom amount mode requires a positive customAmountSought.",
      sampleRows: customAmountMissing,
    });

    const negativeAmount = lawsuits.filter(
      (row) =>
        (row.amountSought != null && Number(row.amountSought) < 0) ||
        (row.customAmountSought != null && Number(row.customAmountSought) < 0)
    );
    addCheck(checks, {
      id: "negative-lawsuit-amount",
      label: "Negative lawsuit amount",
      severity: "critical",
      count: negativeAmount.length,
      description: "Negative lawsuit amount fields undermine restore, filing, and document-generation confidence.",
      sampleRows: negativeAmount,
    });

    const missingVenue = lawsuits.filter((row) => !clean(row.venueSelection || row.venue));
    addCheck(checks, {
      id: "missing-venue",
      label: "Missing venue",
      severity: "warning",
      count: missingVenue.length,
      description: "Venue is important for lawsuit metadata and document generation.",
      sampleRows: missingVenue,
    });

    const otherVenueMissingText = lawsuits.filter(
      (row) => lower(row.venueSelection || row.venue) === "other" && !clean(row.venueOther)
    );
    addCheck(checks, {
      id: "other-venue-missing-text",
      label: "Venue is Other but venueOther is blank",
      severity: "warning",
      count: otherVenueMissingText.length,
      description: "Other venue selections should preserve the user-entered venue text.",
      sampleRows: otherVenueMissingText,
    });

    const clioMappingMissing = lawsuits.filter(
      (row) => !row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)
    );
    addCheck(checks, {
      id: "missing-master-clio-shell-mapping",
      label: "Missing master Clio shell mapping",
      severity: "warning",
      count: clioMappingMissing.length,
      description: "Master Clio shell mapping is important for final document upload/document viewing, but this audit does not call Clio.",
      sampleRows: clioMappingMissing,
    });

    const partialClioMapping = lawsuits.filter(
      (row) =>
        (!!row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)) ||
        (!row.clioMasterMatterId && !!clean(row.clioMasterDisplayNumber))
    );
    addCheck(checks, {
      id: "partial-master-clio-shell-mapping",
      label: "Partial master Clio shell mapping",
      severity: "warning",
      count: partialClioMapping.length,
      description: "A master Clio shell mapping should ideally preserve both clioMasterMatterId and clioMasterDisplayNumber.",
      sampleRows: partialClioMapping,
    });

    const invalidFinalStatus = lawsuits.filter(
      (row) => clean(row.finalStatus) && !["open", "closed"].includes(lower(row.finalStatus))
    );
    addCheck(checks, {
      id: "invalid-lawsuit-final-status",
      label: "lawsuitOptions finalStatus outside Open/Closed/blank policy",
      severity: "critical",
      count: invalidFinalStatus.length,
      description: "Lawsuit final status should remain Open, Closed, or blank under the current workflow policy.",
      sampleRows: invalidFinalStatus,
    });

    const closedWithoutReason = lawsuits.filter(
      (row) => lower(row.finalStatus) === "closed" && !clean(row.closeReason)
    );
    addCheck(checks, {
      id: "closed-lawsuit-without-close-reason",
      label: "Closed lawsuit missing closeReason",
      severity: "critical",
      count: closedWithoutReason.length,
      description: "Closed lawsuits should preserve the selected close workflow reason.",
      sampleRows: closedWithoutReason,
    });

    const reasonWithoutClosed = lawsuits.filter(
      (row) => clean(row.closeReason) && lower(row.finalStatus) !== "closed"
    );
    addCheck(checks, {
      id: "lawsuit-close-reason-without-closed-status",
      label: "closeReason present but lawsuit finalStatus is not Closed",
      severity: "critical",
      count: reasonWithoutClosed.length,
      description: "A close reason without Closed lawsuit final status indicates inconsistent close-workflow state.",
      sampleRows: reasonWithoutClosed,
    });

    const closedLawsuitChildrenNotClosed: LawsuitAuditRow[] = [];
    const closedLawsuitOpenChildRows: ClaimIndexChildRow[] = [];
    for (const lawsuit of lawsuits) {
      if (lower(lawsuit.finalStatus) !== "closed") continue;
      const openChildren = (childrenByMaster.get(clean(lawsuit.masterLawsuitId)) || []).filter(
        (row) => lower(row.final_status) !== "closed"
      );
      if (openChildren.length) {
        closedLawsuitChildrenNotClosed.push(
          withDetail(lawsuit, `${openChildren.length} linked child ClaimIndex row(s) are not Closed.`)
        );
        closedLawsuitOpenChildRows.push(...openChildren);
      }
    }

    addCheck(checks, {
      id: "closed-lawsuit-children-not-closed",
      label: "Closed lawsuit has linked child rows not marked Closed",
      severity: "critical",
      count: closedLawsuitOpenChildRows.length,
      description: "When a lawsuit/master matter is closed, linked child ClaimIndex rows should also be Closed.",
      sampleRows: closedLawsuitChildrenNotClosed,
      sampleChildRows: closedLawsuitOpenChildRows,
    });

    const finalStatusCounts = countBuckets(lawsuits.map((row) => row.finalStatus || ""));
    const closeReasonCounts = countBuckets(lawsuits.map((row) => row.closeReason || ""));
    const amountModeCounts = countBuckets(lawsuits.map((row) => row.amountSoughtMode || ""));
    const venueCounts = countBuckets(lawsuits.map((row) => row.venueSelection || row.venue || ""));

    const mappedClioCount = lawsuits.filter((row) => row.clioMasterMatterId || clean(row.clioMasterDisplayNumber)).length;
    const linkedLawsuitCount = lawsuits.filter((row) => (row.linkedClaimIndexChildCount || 0) > 0).length;
    const criticalIssues = checks.filter((check) => check.severity === "critical").reduce((sum, check) => sum + check.count, 0);
    const warningIssues = checks.filter((check) => check.severity === "warning").reduce((sum, check) => sum + check.count, 0);
    const infoIssues = checks.filter((check) => check.severity === "info").reduce((sum, check) => sum + check.count, 0);

    return NextResponse.json({
      ok: true,
      readOnly: true,
      sourceOfTruth: "Local Lawsuit table plus local ClaimIndex child links",
      generatedAt: now.toISOString(),
      summary: {
        localLawsuitCount: lawsuits.length,
        linkedClaimIndexChildCount: linkedClaimIndexRows.length,
        localLawsuitsWithLinkedChildren: linkedLawsuitCount,
        localLawsuitsWithoutLinkedChildren: lawsuits.length - linkedLawsuitCount,
        mappedMasterClioShellCount: mappedClioCount,
        unmappedMasterClioShellCount: lawsuits.length - mappedClioCount,
        checksRun: checks.length,
        checksWithFindings: checks.filter((check) => check.count > 0).length,
        criticalIssues,
        warningIssues,
        infoIssues,
      },
      counts: {
        finalStatus: finalStatusCounts,
        closeReason: closeReasonCounts,
        amountSoughtMode: amountModeCounts,
        venue: venueCounts,
        masterClioShellMapping: [
          { label: "Mapped master Clio shell", count: mappedClioCount },
          { label: "No mapped master Clio shell", count: lawsuits.length - mappedClioCount },
        ],
        childLinkPresence: [
          { label: "Has linked ClaimIndex children", count: linkedLawsuitCount },
          { label: "No linked ClaimIndex children", count: lawsuits.length - linkedLawsuitCount },
        ],
      },
      checks,
      safety:
        "Read-only Admin Lawsuit/master data-quality audit. This route only reads prisma.lawsuit and prisma.claimIndex. It does not update local lawsuits, update ClaimIndex, restore data, call Clio, generate documents, send email, print, queue, delete, deaggregate, or write the database.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        readOnly: true,
        error: err?.message || "Admin Lawsuit/master data-quality audit failed.",
      },
      { status: 500 }
    );
  }
}
