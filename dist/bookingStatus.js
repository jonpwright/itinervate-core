"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCancelledBooking = isCancelledBooking;
exports.liveBookings = liveBookings;
const CANCELLED = new Set(['cancelled', 'canceled', 'refunded', 'void', 'voided']);
function isCancelledBooking(b, trips) {
    if (!b)
        return false;
    if (CANCELLED.has(String(b.status || '').toLowerCase()))
        return true;
    if (CANCELLED.has(String(b.confirmationStatus || '').toLowerCase()))
        return true;
    if (b.cancellation || b.cancelledAt)
        return true;
    if (trips && b.tripId) {
        const cancelledTrips = trips instanceof Set ? trips : new Set(trips.filter((t) => String(t.status || '').toLowerCase() === 'cancelled').map((t) => t.id));
        if (cancelledTrips.has(b.tripId))
            return true;
    }
    return false;
}
/** The bookings that are still live, in the order given. */
function liveBookings(items, trips) {
    const cancelledTrips = trips ? new Set(trips.filter((t) => String(t.status || '').toLowerCase() === 'cancelled').map((t) => t.id)) : undefined;
    return items.filter((b) => !isCancelledBooking(b, cancelledTrips));
}
