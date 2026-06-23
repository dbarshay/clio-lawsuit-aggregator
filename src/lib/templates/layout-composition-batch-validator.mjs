import { validateTemplateLayoutComposition } from "./layout-composition-validator.mjs";

function findingWithTemplate(finding, template) {
  return {
    templateId: template?.templateId,
    templateName: template?.templateName,
    ...finding,
  };
}

function emptySummary() {
  return {
    templateCount: 0,
    validTemplateCount: 0,
    invalidTemplateCount: 0,
    errorCount: 0,
    warningCount: 0,
  };
}

export function validateTemplateLayoutCompositionBatch(input) {
  const templates = Array.isArray(input?.templates) ? input.templates : [];
  const registry = input?.registry || {};
  const exemptTemplateKinds = input?.exemptTemplateKinds || [];
  const validationMode = input?.validationMode;

  const summary = emptySummary();
  const templateResults = [];
  const errors = [];
  const warnings = [];

  summary.templateCount = templates.length;

  for (const template of templates) {
    const result = validateTemplateLayoutComposition({
      ...template,
      registry,
      exemptTemplateKinds,
      validationMode,
    });

    templateResults.push({
      templateId: template?.templateId,
      templateName: template?.templateName,
      templateKind: template?.templateKind,
      ok: result.ok,
      errors: result.errors,
      warnings: result.warnings,
      normalizedComposition: result.normalizedComposition,
    });

    if (result.ok) {
      summary.validTemplateCount += 1;
    } else {
      summary.invalidTemplateCount += 1;
    }

    for (const error of result.errors) {
      errors.push(findingWithTemplate(error, template));
    }
    for (const warning of result.warnings) {
      warnings.push(findingWithTemplate(warning, template));
    }
  }

  summary.errorCount = errors.length;
  summary.warningCount = warnings.length;

  return {
    ok: summary.invalidTemplateCount === 0,
    summary,
    templateResults,
    errors,
    warnings,
  };
}
