/**
 * One answer to "is this booking still live?" for every surface — the trip page,
 * dashboard, Live Map, ride suggestions, conflicts, calendar export, widgets.
 * A flight or stay is cancelled when its own status says so, when its
 * confirmation was withdrawn, when a cancellation record exists, or when the
 * trip it belongs to was cancelled.
 */
type Statusy = { status?: string | null; confirmationStatus?: string | null; cancellation?: unknown; cancelledAt?: unknown; tripId?: string | null; duffelOrder?: { orderStatus?: string | null } | null } | null | undefined;
type TripLike = { id: string; status?: string | null };

const CANCELLED = new Set(['cancelled', 'canceled', 'refunded', 'void', 'voided']);

export function isCancelledBooking(b: Statusy, trips?: TripLike[] | Set<string>): boolean {
  if (!b) return false;
  if (CANCELLED.has(String(b.status || '').toLowerCase())) return true;
  if (CANCELLED.has(String(b.confirmationStatus || '').toLowerCase())) return true;
  if (b.cancellation || b.cancelledAt) return true;
  if (CANCELLED.has(String(b.duffelOrder?.orderStatus || '').toLowerCase())) return true;
  if (trips && b.tripId) {
    const cancelledTrips = trips instanceof Set ? trips : new Set(trips.filter((t) => String(t.status || '').toLowerCase() === 'cancelled').map((t) => t.id));
    if (cancelledTrips.has(b.tripId)) return true;
  }
  return false;
}

/** The bookings that are still live, in the order given. */
export function liveBookings<T extends Statusy>(items: T[], trips?: TripLike[]): T[] {
  const cancelledTrips = trips ? new Set(trips.filter((t) => String(t.status || '').toLowerCase() === 'cancelled').map((t) => t.id)) : undefined;
  return items.filter((b) => !isCancelledBooking(b, cancelledTrips));
}
