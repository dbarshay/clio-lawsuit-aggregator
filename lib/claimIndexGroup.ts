type ClaimIndexRow = {
  claim_number_normalized: string | null;
  master_lawsuit_id: string | null;
};

export function groupByClaim(rows: any[]) {
  const groups: Record<string, any[]> = {};

  for (const row of rows) {
    const key = row.claim_number_normalized || "NO_CLAIM";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(row);
  }

  return Object.entries(groups).map(([claim, rows]) => ({
    claim_number: claim,
    count: rows.length,
    rows,
  }));
}
