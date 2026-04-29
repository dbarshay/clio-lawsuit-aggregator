export function parseRetryAfterMs(text: string, fallbackMs = 5000) {
  const match = text.match(/Retry in\s+(\d+)\s+seconds/i);
  if (!match) return fallbackMs;

  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds < 0) return fallbackMs;

  return seconds * 1000;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
