import { validateTemplateLayoutCompositionBatch } from "./layout-composition-batch-validator.mjs";

function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const templateA = a.templateId || "";
    const templateB = b.templateId || "";
    if (templateA !== templateB) return templateA.localeCompare(templateB);
    const codeA = a.code || "";
    const codeB = b.code || "";
    if (codeA !== codeB) return codeA.localeCompare(codeB);
    const roleA = a.role || "";
    const roleB = b.role || "";
    if (roleA !== roleB) return roleA.localeCompare(roleB);
    const assetA = a.assetKey || "";
    const assetB = b.assetKey || "";
    return assetA.localeCompare(assetB);
  });
}

function summarizeByCode(findings) {
  const counts = new Map();
  for (const finding of findings) {
    const code = finding.code || "UNKNOWN";
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, count]) => ({ code, count }));
}

function formatFinding(finding) {
  const pieces = [
    finding.templateId || "unknown-template",
    finding.code || "UNKNOWN",
  ];
  if (finding.role) pieces.push(`role=${finding.role}`);
  if (finding.assetKey) pieces.push(`asset=${finding.assetKey}`);
  if (finding.field) pieces.push(`field=${finding.field}`);
  return `- ${pieces.join(" | ")}`;
}

export function buildTemplateLayoutCompositionValidationReport(input) {
  const batch = validateTemplateLayoutCompositionBatch(input);
  const sortedErrors = sortFindings(batch.errors);
  const sortedWarnings = sortFindings(batch.warnings);

  const report = {
    ok: batch.ok,
    summary: {
      ...batch.summary,
    },
    errorSummaryByCode: summarizeByCode(sortedErrors),
    warningSummaryByCode: summarizeByCode(sortedWarnings),
    invalidTemplates: batch.templateResults
      .filter((item) => !item.ok)
      .map((item) => ({
        templateId: item.templateId,
        templateName: item.templateName,
        templateKind: item.templateKind,
        errorCount: item.errors.length,
        warningCount: item.warnings.length,
      }))
      .sort((a, b) => (a.templateId || "").localeCompare(b.templateId || "")),
    warningTemplates: batch.templateResults
      .filter((item) => item.warnings.length > 0)
      .map((item) => ({
        templateId: item.templateId,
        templateName: item.templateName,
        templateKind: item.templateKind,
        warningCount: item.warnings.length,
      }))
      .sort((a, b) => (a.templateId || "").localeCompare(b.templateId || "")),
    errors: sortedErrors,
    warnings: sortedWarnings,
  };

  const markdownLines = [
    "# Template Layout Composition Validation Report",
    "",
    `Status: ${report.ok ? "PASS" : "FAIL"}`,
    "",
    "## Summary",
    "",
    `- Templates: ${report.summary.templateCount}`,
    `- Valid templates: ${report.summary.validTemplateCount}`,
    `- Invalid templates: ${report.summary.invalidTemplateCount}`,
    `- Errors: ${report.summary.errorCount}`,
    `- Warnings: ${report.summary.warningCount}`,
    "",
    "## Error codes",
    "",
    ...(report.errorSummaryByCode.length
      ? report.errorSummaryByCode.map((item) => `- ${item.code}: ${item.count}`)
      : ["- None"]),
    "",
    "## Warning codes",
    "",
    ...(report.warningSummaryByCode.length
      ? report.warningSummaryByCode.map((item) => `- ${item.code}: ${item.count}`)
      : ["- None"]),
    "",
    "## Invalid templates",
    "",
    ...(report.invalidTemplates.length
      ? report.invalidTemplates.map((item) => `- ${item.templateId} | ${item.templateName} | errors=${item.errorCount} | warnings=${item.warningCount}`)
      : ["- None"]),
    "",
    "## Errors",
    "",
    ...(sortedErrors.length ? sortedErrors.map(formatFinding) : ["- None"]),
    "",
    "## Warnings",
    "",
    ...(sortedWarnings.length ? sortedWarnings.map(formatFinding) : ["- None"]),
    "",
  ];

  return {
    ...report,
    markdown: markdownLines.join("\n"),
  };
}
