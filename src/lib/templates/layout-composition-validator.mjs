export const CANONICAL_LAYOUT_ROLES = Object.freeze([
  "letterhead",
  "pleadingPaper",
  "simpleCoverFaxPage",
]);

export const REJECTED_LAYOUT_ROLE_ALIASES = Object.freeze([
  "simpleCoverPage",
  "coverPage",
  "faxCover",
  "pleading",
  "pleadingTemplate",
]);

export const DEFAULT_LAYOUT_OUTPUT_ORDER = Object.freeze([
  "simpleCoverFaxPage",
  "letterhead",
  "pleadingPaper",
]);

const VALID_MODES = new Set(["none", "single", "composed"]);
const VALID_APPLIES_TO = new Set(["coverOnly", "firstPage", "bodyOnly", "allPages"]);
const VALID_MERGE_FIELD_POLICIES = new Set([
  "none",
  "requiresTemplateFields",
  "requiresWorkflowFields",
]);
const VALID_ROLES = new Set(CANONICAL_LAYOUT_ROLES);
const REJECTED_ALIASES = new Set(REJECTED_LAYOUT_ROLE_ALIASES);

function finding(severity, code, message, extra = {}) {
  return {
    severity,
    code,
    message,
    ...extra,
  };
}

function keyForComposition(roles) {
  return [...roles].sort().join("+");
}

function normalizeAllowedCompositions(rules = []) {
  const allowed = new Set();
  for (const rule of rules) {
    if (typeof rule === "string") {
      allowed.add(keyForComposition(rule.split("+").filter(Boolean)));
      continue;
    }
    if (rule && Array.isArray(rule.roles)) {
      allowed.add(keyForComposition(rule.roles));
    }
  }
  return allowed;
}

function registryAssetMap(layoutAssets = []) {
  const map = new Map();
  for (const asset of layoutAssets) {
    if (asset && typeof asset.assetKey === "string") {
      map.set(asset.assetKey, asset);
    }
  }
  return map;
}

function registryMergeFieldSet(mergeFieldDefinitions = []) {
  const fields = new Set();
  for (const field of mergeFieldDefinitions) {
    if (typeof field === "string") {
      fields.add(field);
    } else if (field && typeof field.key === "string") {
      fields.add(field.key);
    }
  }
  return fields;
}

function requiredFieldsForSelection(selection, registryAsset) {
  const fields = new Set();
  for (const field of selection?.requiredMergeFields || []) {
    fields.add(field);
  }
  for (const field of registryAsset?.requiredMergeFields || []) {
    fields.add(field);
  }
  return [...fields];
}

function dependencyCodeForRole(role) {
  if (role === "letterhead") return "LAYOUT_DEPENDENCY_MISSING_LETTERHEAD_FIELD";
  if (role === "pleadingPaper") return "LAYOUT_DEPENDENCY_MISSING_PLEADING_FIELD";
  if (role === "simpleCoverFaxPage") return "LAYOUT_DEPENDENCY_MISSING_SIMPLE_COVER_FAX_FIELD";
  return "LAYOUT_DEPENDENCY_MISSING_FIELD";
}

export function validateTemplateLayoutComposition(input) {
  const errors = [];
  const warnings = [];
  const templateId = input?.templateId;
  const composition = input?.layoutComposition;
  const registry = input?.registry || {};
  const assets = Array.isArray(composition?.assets) ? composition.assets : [];
  const exemptKinds = new Set(input?.exemptTemplateKinds || []);
  const templateKind = input?.templateKind;

  if (!composition) {
    if (exemptKinds.has(templateKind)) {
      warnings.push(finding("warning", "LAYOUT_COMPOSITION_OMITTED_FOR_EXEMPT_KIND", "Layout composition is omitted for an exempt template kind.", { templateId }));
      return {
        ok: true,
        errors,
        warnings,
        normalizedComposition: {
          mode: "none",
          assets: [],
          outputOrder: [],
        },
      };
    }
    errors.push(finding("error", "LAYOUT_COMPOSITION_MISSING", "Template layout composition metadata is required.", { templateId }));
    return { ok: false, errors, warnings, normalizedComposition: null };
  }

  if (!VALID_MODES.has(composition.mode)) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_INVALID_MODE", "Layout composition mode must be none, single, or composed.", { templateId }));
  }

  if (!Array.isArray(composition.assets)) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_ASSETS_NOT_ARRAY", "Layout composition assets must be an array.", { templateId }));
  }

  if (composition.mode === "none" && assets.length !== 0) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_NONE_WITH_ASSETS", "Mode none must not include layout assets.", { templateId }));
  }
  if (composition.mode === "single" && assets.length !== 1) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_SINGLE_ASSET_COUNT", "Mode single must include exactly one layout asset.", { templateId }));
  }
  if (composition.mode === "composed" && assets.length < 2) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_COMPOSED_ASSET_COUNT", "Mode composed must include two or more layout assets.", { templateId }));
  }

  const roleCounts = new Map();
  const assetKeyCounts = new Map();
  const selectedRoles = [];
  const assetMap = registryAssetMap(registry.layoutAssets);
  const mergeFields = registryMergeFieldSet(registry.mergeFieldDefinitions);

  for (const asset of assets) {
    const role = asset?.role;
    const assetKey = asset?.assetKey;

    if (REJECTED_ALIASES.has(role)) {
      errors.push(finding("error", "LAYOUT_ROLE_REJECTED_ALIAS", "Layout role uses a rejected alias; use a canonical role.", { templateId, role, assetKey }));
    } else if (!VALID_ROLES.has(role)) {
      errors.push(finding("error", "LAYOUT_ROLE_INVALID", "Layout role must be canonical.", { templateId, role, assetKey }));
    } else {
      selectedRoles.push(role);
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    }

    if (typeof assetKey !== "string" || assetKey.trim() === "") {
      errors.push(finding("error", "LAYOUT_ASSET_KEY_MISSING", "Layout asset key is required.", { templateId, role }));
    } else {
      assetKeyCounts.set(assetKey, (assetKeyCounts.get(assetKey) || 0) + 1);
    }

    if (typeof asset?.required !== "boolean") {
      errors.push(finding("error", "LAYOUT_ASSET_REQUIRED_FLAG_INVALID", "Layout asset required flag must be boolean.", { templateId, role, assetKey }));
    }
    if (!VALID_APPLIES_TO.has(asset?.appliesTo)) {
      errors.push(finding("error", "LAYOUT_ASSET_APPLIES_TO_INVALID", "Layout asset appliesTo must be coverOnly, firstPage, bodyOnly, or allPages.", { templateId, role, assetKey }));
    }
    if (!VALID_MERGE_FIELD_POLICIES.has(asset?.mergeFieldPolicy)) {
      errors.push(finding("error", "LAYOUT_ASSET_MERGE_FIELD_POLICY_INVALID", "Layout asset mergeFieldPolicy is invalid.", { templateId, role, assetKey }));
    }

    if (typeof assetKey === "string" && assetKey.trim() !== "") {
      const registryAsset = assetMap.get(assetKey);
      if (!registryAsset) {
        errors.push(finding("error", "LAYOUT_ASSET_UNRESOLVED", "Selected layout asset key does not exist in the registry.", { templateId, role, assetKey }));
      } else {
        if (registryAsset.active === false && input?.validationMode !== "archived") {
          errors.push(finding("error", "LAYOUT_ASSET_INACTIVE", "Selected layout asset is inactive.", { templateId, role, assetKey }));
        }
        if (registryAsset.role !== role) {
          errors.push(finding("error", "LAYOUT_ASSET_ROLE_MISMATCH", "Selected layout asset registry role does not match declared role.", { templateId, role, assetKey, registryRole: registryAsset.role }));
        }
        for (const field of requiredFieldsForSelection(asset, registryAsset)) {
          if (!mergeFields.has(field)) {
            errors.push(finding("error", dependencyCodeForRole(role), "Required layout merge field is not declared in merge-field definitions.", { templateId, role, assetKey, field }));
          }
        }
      }
    }
  }

  for (const [role, count] of roleCounts.entries()) {
    if (count > 1) {
      errors.push(finding("error", "LAYOUT_ROLE_DUPLICATE", "Duplicate layout roles are prohibited.", { templateId, role }));
    }
  }

  for (const [assetKey, count] of assetKeyCounts.entries()) {
    if (count > 1) {
      errors.push(finding("error", "LAYOUT_ASSET_KEY_DUPLICATE", "Duplicate layout asset keys are prohibited.", { templateId, assetKey }));
    }
  }

  const allowed = normalizeAllowedCompositions(registry.allowedCompositions);
  if (selectedRoles.length > 0 && allowed.size > 0 && !allowed.has(keyForComposition(selectedRoles))) {
    errors.push(finding("error", "LAYOUT_COMPOSITION_DISALLOWED", "Selected layout role combination is not allowed by the composition registry.", { templateId, roles: selectedRoles }));
  }

  let outputOrder = composition.outputOrder;
  if (outputOrder == null) {
    outputOrder = DEFAULT_LAYOUT_OUTPUT_ORDER.filter((role) => selectedRoles.includes(role));
    if (selectedRoles.length > 1) {
      warnings.push(finding("warning", "LAYOUT_OUTPUT_ORDER_DEFAULTED", "Output order was omitted; deterministic default ordering was applied.", { templateId, outputOrder }));
    }
  } else if (!Array.isArray(outputOrder)) {
    errors.push(finding("error", "LAYOUT_OUTPUT_ORDER_NOT_ARRAY", "Output order must be an array when supplied.", { templateId }));
    outputOrder = [];
  } else {
    const selectedRoleSet = new Set(selectedRoles);
    const orderSet = new Set(outputOrder);
    for (const role of outputOrder) {
      if (!selectedRoleSet.has(role)) {
        errors.push(finding("error", "LAYOUT_OUTPUT_ORDER_UNKNOWN_ROLE", "Output order references a role that is not selected.", { templateId, role }));
      }
    }
    for (const role of selectedRoleSet) {
      if (!orderSet.has(role)) {
        errors.push(finding("error", "LAYOUT_OUTPUT_ORDER_MISSING_ROLE", "Output order must include every selected role exactly once.", { templateId, role }));
      }
    }
    if (orderSet.size !== outputOrder.length) {
      errors.push(finding("error", "LAYOUT_OUTPUT_ORDER_DUPLICATE_ROLE", "Output order contains duplicate roles.", { templateId }));
    }
  }

  const normalizedComposition = {
    mode: composition.mode,
    assets: assets.map((asset) => ({ ...asset })),
    outputOrder,
  };

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalizedComposition,
  };
}
