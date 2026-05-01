export function getCustomFieldValue(matter: any, fieldId: number) {
  const cfv = matter?.custom_field_values?.find(
    (cf: any) => Number(cf?.custom_field?.id) === Number(fieldId)
  );

  if (!cfv) return null;

  return cfv.value ?? null;
}

function normalizeDenialValue(value: any): string {
  if (value === undefined || value === null) return "";

  // If it's already a primitive
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  // If it's an object (Clio sometimes returns structured values)
  if (typeof value === "object") {
    if ("value" in value) return String(value.value).trim();
    if ("id" in value) return String(value.id).trim();
  }

  return String(value).trim();
}

export function getDenialReasonLabel(value: any) {
  const map: Record<string, string> = {
    "12497975": "Medical Necessity (IME)",
    "12498110": "Medical Necessity (IME)",
    "12498065": "Fee Schedule / Coding",
    "12498155": "Fee Schedule / Coding",
  };

  const key = normalizeDenialValue(value);

  return map[key] || key;
}
