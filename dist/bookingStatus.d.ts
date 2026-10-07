/**
 * One answer to "is this booking still live?" for every surface — the trip page,
 * dashboard, Live Map, ride suggestions, conflicts, calendar export, widgets.
 * A flight or stay is cancelled when its own status says so, when its
 * confirmation was withdrawn, when a cancellation record exists, or when the
 * trip it belongs to was cancelled.
 */
type Statusy = {
    status?: string | null;
    confirmationStatus?: string | null;
    cancellation?: unknown;
    cancelledAt?: unknown;
    tripId?: string | null;
    duffelOrder?: {
        orderStatus?: string | null;
    } | null;
} | null | undefined;
type TripLike = {
    id: string;
    status?: string | null;
};
export declare function isCancelledBooking(b: Statusy, trips?: TripLike[] | Set<string>): boolean;
/** The bookings that are still live, in the order given. */
export declare function liveBookings<T extends Statusy>(items: T[], trips?: TripLike[]): T[];
export {};
