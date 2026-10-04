/**
 * The in-progress booking, held between the hub screen and checkout.
 *
 * sessionStorage rather than React state because the funnel spans several
 * routes and — once payment is real — the user will physically leave the app
 * to pay. iOS will happily discard the tab while they are gone, so the draft
 * has to survive a reload. Every access is try/caught; blocked storage
 * degrades to an in-memory draft rather than throwing.
 */

const KEY = "chargehub.booking.draft";

export interface BookingDraft {
  stationId: string;
  outletId: string;
  planId: string;
  /** Generated once per funnel entry; becomes the Idempotency-Key on submit. */
  idempotencyKey: string;
}

let memory: BookingDraft | null = null;

export function readDraft(): BookingDraft | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: Omit<BookingDraft, "idempotencyKey">): BookingDraft {
  const existing = readDraft();
  // Keep the key stable while the user edits the same funnel, so a retry after
  // a flaky network can't create two bookings.
  const idempotencyKey =
    existing && existing.stationId === draft.stationId
      ? existing.idempotencyKey
      : newKey();

  const full: BookingDraft = { ...draft, idempotencyKey };
  memory = full;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    /* in-memory only */
  }
  return full;
}

export function clearDraft(): void {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

function newKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
