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
export function getRateConditions(rate: any): RateConditions {
  const total = parseFloat(rate?.total_amount || '0');
  const timeline: any[] = Array.isArray(rate?.cancellation_timeline) ? rate.cancellation_timeline : [];

  const positive = timeline
    .map((t) => ({ before: t?.before as string | undefined, amount: parseFloat(t?.refund_amount || '0') }))
    .filter((t) => t.amount > 0 && !!t.before)
    .sort((a, b) => new Date(a.before as string).getTime() - new Date(b.before as string).getTime());

  let refundable = false;
  let freeCancellationUntil: string | null = null;
  let partiallyRefundable = false;

  if (positive.length > 0) {
    refundable = true;
    const fullRefund = positive.find((t) => total > 0 && t.amount >= total - 0.01);
    if (fullRefund) {
      freeCancellationUntil = fullRefund.before as string;
    } else {
      partiallyRefundable = true;
    }
  }

  const boardType = typeof rate?.board_type === 'string' && rate.board_type ? rate.board_type : null;
  const payAtProperty =
    typeof rate?.payment_type === 'string' && rate.payment_type.toLowerCase().includes('property');

  return { refundable, freeCancellationUntil, partiallyRefundable, boardType, payAtProperty };
}

/** i18n key suffixes for the common Duffel board_type enum values. */
export const BOARD_TYPE_I18N: Record<string, string> = {
  room_only: 'boardRoomOnly',
  breakfast: 'boardBreakfast',
  bed_and_breakfast: 'boardBreakfast',
  half_board: 'boardHalfBoard',
  full_board: 'boardFullBoard',
  all_inclusive: 'boardAllInclusive',
  lunch: 'boardLunch',
  dinner: 'boardDinner',
};

/** Fallback label when a board_type has no dedicated translation. */
export function humaniseBoardType(boardType: string): string {
  return boardType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
