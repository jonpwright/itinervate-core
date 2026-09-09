/**
 * Pure, client-safe helpers to derive human-friendly conditions from a Duffel
 * Stays rate object: refundability + free-cancellation deadline, board/meal
 * type, and whether payment is taken now or at the property.
 *
 * The UI layer is responsible for localising the returned structured data.
 */
export interface RateConditions {
    /** True when at least some money is refundable if cancelled in time. */
    refundable: boolean;
    /** ISO date/time by which a FULL refund is available, else null. */
    freeCancellationUntil: string | null;
    /** True when refundable but not a full refund (partial only). */
    partiallyRefundable: boolean;
    /** Raw Duffel board_type (e.g. 'room_only', 'breakfast'), or null. */
    boardType: string | null;
    /** True when the stay is paid at the property rather than now. */
    payAtProperty: boolean;
}
/**
 * Interpret a Duffel Stays rate's cancellation_timeline / board_type / payment_type.
 * cancellation_timeline is an array of { before, refund_amount, currency }: cancel
 * before `before` to receive `refund_amount`. Empty/absent => non-refundable.
 */
export declare function getRateConditions(rate: any): RateConditions;
/** i18n key suffixes for the common Duffel board_type enum values. */
export declare const BOARD_TYPE_I18N: Record<string, string>;
/** Fallback label when a board_type has no dedicated translation. */
export declare function humaniseBoardType(boardType: string): string;
