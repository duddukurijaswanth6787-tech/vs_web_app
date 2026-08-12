const GUEST_ID_KEY = 'vd_guest_id';

export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getStoredGuestId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GUEST_ID_KEY);
}

export function hasStoredGuestId(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(GUEST_ID_KEY);
}

export function clearGuestId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_ID_KEY);
  }
}
