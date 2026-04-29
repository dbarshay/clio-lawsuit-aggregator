const contactCache = new Map<number, string | null>();

export function getCachedContact(id: number) {
  return contactCache.get(id);
}

export function setCachedContact(id: number, name: string | null) {
  contactCache.set(id, name);
}

export function clearContactCache() {
  contactCache.clear();
}
