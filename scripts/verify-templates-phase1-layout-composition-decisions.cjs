const fs = require("fs");

const docPath = "docs/template-repository/templates-phase1-layout-composition-decisions.md";
const text = fs.readFileSync(docPath, "utf8");

const checks = [
  ["phase_title", /Templates Phase 1 — Template Layout Composition Decisions/],
  ["docs_only_status", /Design\/proposal locked; docs-only phase/],
  ["no_phase48h_numbering", /Do \*\*not\*\* use Phase 48H numbering/],
  ["previous_head", /9f8a8141ab39978a94fe311d67ccfb08ba729991/],
  ["previous_tag", /signer-profile-addressee-source-design-phase48g-20260622-212543/],
  ["no_db_mutation_boundary", /does \*\*not\*\* mutate the database/],
  ["no_docx_conversion_boundary", /convert DOCX files/],
  ["no_clio_graph_finalize_upload_boundary", /perform Clio actions[\s\S]*perform Microsoft Graph actions[\s\S]*call finalize\/upload routes[\s\S]*live document upload\/finalization workflows/],
  ["layout_assets_non_generation", /Layout assets are non-generation assets and must not appear as standalone Generate Documents choices/],
  ["composition_allows_combinations", /letterhead \+ pleading paper[\s\S]*simple cover\/fax page \+ letterhead \+ pleading paper[\s\S]*no layout asset/],
  ["q1_hybrid_cover_fax", /Cover\/fax asset model[\s\S]*Decision: \*\*Hybrid\.\*\*/],
  ["q2_modes", /Metadata must distinguish `cover_page` from `fax_transmittal`/],
  ["q3_letterhead_pleading_metadata", /Letterhead \+ pleading paper behavior[\s\S]*Decision: \*\*Template-specific metadata decides\.\*\*/],
  ["q4_page_numbering_metadata", /Cover\/fax page numbering[\s\S]*Decision: \*\*Metadata decides\.\*\*/],
  ["q5_flow_metadata", /New page vs\. same-page continuation[\s\S]*Decision: \*\*Metadata decides\.\*\*/],
  ["q6_duplicate_strict_exception", /Duplicate layout roles[\s\S]*Decision: \*\*Strict default, metadata exception\.\*\*/],
  ["q7_admin_warnings", /Layout compatibility validation[\s\S]*Decision: \*\*Admin-only warnings allowed during testing\.\*\*/],
  ["q8_versioning_hybrid", /Layout asset versioning[\s\S]*Decision: \*\*Hybrid\.\*\*/],
  ["q9_no_overrides", /Layout setting overrides[\s\S]*Decision: \*\*No overrides for now\.\*\*/],
  ["q10_repository_first", /Metadata location[\s\S]*Decision: \*\*Repository first, database later if needed\.\*\*/],
  ["q11_ui_view_only", /Admin\/template-management UI[\s\S]*Decision: \*\*View in UI eventually, edit in repository\.\*\*/],
  ["q12_fax_fields_standard", /Fax-specific fields[\s\S]*Decision: \*\*Include fax-specific fields in the cover\/fax standard\.\*\*/],
  ["fax_field_list", /recipient fax number[\s\S]*recipient phone number[\s\S]*sender fax number[\s\S]*sender phone\/extension[\s\S]*total pages[\s\S]*confidentiality notice/],
  ["metadata_shape_present", /layoutComposition\.assets[\s\S]*`cover_fax`[\s\S]*`letterhead`[\s\S]*`pleading_paper`/],
  ["future_verifier_expectations", /Future implementation verifiers should confirm/]
];

let failed = false;
for (const [name, pattern] of checks) {
  if (pattern.test(text)) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("PASS: Templates Phase 1 layout composition decisions doc verified");
