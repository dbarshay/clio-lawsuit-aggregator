export function getCustomFieldValue(matter: any, fieldId: number) {
  const cfv = matter?.custom_field_values?.find(
    (cf: any) => cf?.custom_field?.id === fieldId
  );

  if (!cfv) return null;

  return cfv.value ?? null;
}

export function getDenialReasonLabel(value: any) {
  const map: Record<string, string> = {
    "12497975": "Medical Necessity (IME)",
    "12498065": "Fee Schedule / Coding",
    "12498155": "Fee Schedule / Coding",
    "12498110": "Medical Necessity (IME)",
  };

return map[String(value)] || (value ? String(value) : "");
}