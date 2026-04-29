export function assertValidClaimNumberWrite(value: unknown) {
  const s = String(value ?? "").trim();

  if (!s) return;

  if (/^\d{2}\.\d{4}\.\d{5}$/.test(s)) {
    throw new Error(
      `Refusing to write master lawsuit ID "${s}" into CLAIM NUMBER field`
    );
  }
}
