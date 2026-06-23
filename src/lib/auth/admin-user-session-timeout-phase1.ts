export const IDLE_TIMEOUT_MINUTES = 30;
export const IDLE_TIMEOUT_WARNING_MINUTES = 2;

export function getIdleTimeoutExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + IDLE_TIMEOUT_MINUTES * 60 * 1000);
}

export function getIdleTimeoutWarningAt(now = new Date()): Date {
  return new Date(now.getTime() + (IDLE_TIMEOUT_MINUTES - IDLE_TIMEOUT_WARNING_MINUTES) * 60 * 1000);
}
