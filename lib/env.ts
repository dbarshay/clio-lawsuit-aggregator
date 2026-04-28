export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[ENV] Missing: ${name}`);
  return value;
}
