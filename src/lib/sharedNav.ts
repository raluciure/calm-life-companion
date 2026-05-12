// Tiny event bus for navigating to a shared grocery list from anywhere
// (Home / Profile) into the Meals → Grocery tab with that list selected.

const EVENT = "open-shared-grocery";

export const PENDING_KEY = "pending_shared_grocery_id";

export function openSharedGrocery(sharedItemId: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, sharedItemId);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: sharedItemId }));
}

export function onOpenSharedGrocery(cb: (sharedItemId: string) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function takePendingSharedGrocery(): string | null {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    if (v) sessionStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
}
