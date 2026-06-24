import fs from "node:fs";

const checks = [];
const add = (name, ok, detail = "") => checks.push({ name, ok, detail });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";

const schema = read("prisma/schema.prisma");
for (const model of ["DocumentTemplate", "DocumentTemplateVersion", "DocumentTemplateMergeField"]) {
  add(`Existing Prisma model ${model}`, schema.includes(`model ${model}`));
}

const contractPath = "src/lib/templates/template-builder-readiness-contract.ts";
const contract = read(contractPath);
add("Readiness contract exists", contract.length > 0);
for (const token of [
  "TEMPLATE_BUILDER_PERMISSION",
  "templates.manage",
  "TEMPLATE_REPOSITORY_STORAGE_PREFIXES",
  "templates/active/",
  "templates/inactive/",
  "templates/archived/",
  "templates/deleted/",
  "TEMPLATE_STATUSES",
  "Active",
  "Inactive",
  "Archived",
  "Deleted",
  "TEMPLATE_BUILDER_STATUS_TRANSITIONS",
  "requiresConfirmation",
  "requiresTokenScan",
  "updatesLastEdited",
  "auditLogged",
  "storageMoveRequired",
  "templateBuilderStatusFilterIncludes",
  "templateBuilderIsGenerationEligible",
  "templateBuilderShowsStoredPathInRoutineUi",
]) {
  add(`Readiness contract contains ${token}`, contract.includes(token));
}

const requiredTransitionFragments = [
  `action: "makeActive"`,
  `action: "deactivate"`,
  `action: "archive"`,
  `action: "delete"`,
  `action: "restore"`,
  `to: "Inactive"`,
  `requiresConfirmation: true`,
  `requiresTokenScan: true`,
  `updatesLastEdited: false`,
  `storageMoveRequired: true`,
];
for (const token of requiredTransitionFragments) {
  add(`Lifecycle contract includes ${token}`, contract.includes(token));
}

const doc = read("docs/templates/template-builder-phase2-permission-lifecycle-readiness.md");
for (const token of [
  "Template Builder Phase 2",
  "templates.manage",
  "Templates are never stored in Clio",
  "Status lifecycle actions move DOCX objects",
  "Does not update Last Edited",
  "Requires token scan",
  "Requires strong confirmation",
  "All excludes Deleted",
  "Only Active templates are eligible",
  "must not show internal storage paths",
]) {
  add(`Phase 2 doc contains ${token}`, doc.includes(token));
}

const landing = read("app/admin/document-templates/page.tsx");
add("Landing references Phase 2 lifecycle contract", landing.includes("Phase 2 centralizes this lifecycle contract under templates.manage"));

const view = read("app/admin/document-templates/view/page.tsx");
add("View page references templates.manage lifecycle contract", view.includes("templates.manage lifecycle contract"));

const pkg = JSON.parse(read("package.json"));
add("Package has Phase 2 verifier script", pkg.scripts && pkg.scripts["verify:template-builder-phase2"] === "node scripts/verify-template-builder-phase2-readiness.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`${color}: ${check.name}${check.detail ? " - " + check.detail : ""}`);
}
if (failed.length > 0) {
  console.error(`\n${failed.length} Template Builder Phase 2 readiness checks failed.`);
  process.exit(1);
}
console.log("\nPASS: Template Builder Phase 2 permission gate and repository lifecycle readiness verified.");
