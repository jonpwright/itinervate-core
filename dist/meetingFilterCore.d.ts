/**
 * Searching, filtering and sorting meetings and trips.
 *
 * Kept BYTE-IDENTICAL between the website and the mobile app so the two never
 * drift into disagreeing about what "past" means or what a search matches:
 *   diff itinervate-website/lib/meetingFilterCore.ts \
 *        itinervate-mobile/lib/meetingFilterCore.ts
 *
 * It is therefore self-contained — no imports, no platform APIs — and `now` is
 * always injected so every rule is directly testable.
 *
 * The platforms store some fields differently, which a shared filter has to
 * absorb rather than assume away:
 *   - `attendees` is a comma-separated STRING on the website, but an ARRAY of
 *     objects (or of plain strings) on mobile.
 *   - the website has `company`; mobile does not.
 *   - `duration` is optional on the website and required on mobile.
 */
/** Time window to restrict a list to. Orthogonal to `status`. */
export type DateRangePreset = 'all' | 'lastTrip' | 'next30' | 'last7' | 'last30' | 'last60' | 'last90' | 'thisYear' | 'custom';
/** State of a meeting, independent of the time window in view. */
export type StatusFilter = 'all' | 'upcoming' | 'past' | 'confirmed' | 'pending' | 'needsDebrief';
export type SortOrder = 'newest' | 'oldest' | 'title';
export interface MeetingFilter {
    query: string;
    range: DateRangePreset;
    /** Inclusive YYYY-MM-DD bounds, used only when range === 'custom'. */
    from?: string;
    to?: string;
    status: StatusFilter;
    sort: SortOrder;
}
export declare const DEFAULT_MEETING_FILTER: MeetingFilter;
/** How many controls are actively narrowing the list, for a badge on the UI. */
export declare function activeFilterCount(f: MeetingFilter): number;
/**
 * A stored date as "YYYY-MM-DD" in local time, whatever shape it arrived in.
 * For presentation code that wants to slice or compare day strings.
 */
export declare function toDayString(date?: unknown): string;
/**
 * Parses a stored "YYYY-MM-DD" (+ optional "HH:MM") as LOCAL wall-clock time.
 *
 * Built from numeric components rather than `new Date(string)` on purpose:
 * `new Date("2026-07-25")` is parsed as UTC midnight and renders as the
 * PREVIOUS day for anyone west of UTC, which would file a meeting under the
 * wrong day and drop it from the wrong end of a range.
 */
export declare function parseLocalDateTime(date?: unknown, time?: string): Date | null;
/** Start of a meeting, or null when it has no usable date. */
export declare function meetingStart(m: any): Date | null;
/** End of a meeting = start + duration, defaulting to 60 minutes. */
export declare function meetingEnd(m: any): Date | null;
/** True once the meeting's full duration has elapsed. */
export declare function isPastMeeting(m: any, now: Date): boolean;
/**
 * Has this meeting been debriefed? Counts partial saves (a rating or a note),
 * so "needs debrief" does not keep nagging about one already engaged with.
 */
export declare function hasDebrief(m: any): boolean;
/** True when a stored status counts as confirmed on either platform. */
export declare function isConfirmed(m: any): boolean;
/** True when the record is archived and should be hidden by default. */
export declare function isArchived(x: any): boolean;
/**
 * Attendee names as a flat list, absorbing every shape the platforms use: a
 * comma-separated string (website), an array of objects with name/email
 * (mobile), or an array of plain strings.
 */
export declare function attendeeNames(m: any): string[];
/** Everything about a meeting a text search should look inside. */
export declare function meetingHaystack(m: any): string;
/** Everything about a trip a text search should look inside. */
export declare function tripHaystack(t: any): string;
/**
 * Every whitespace-separated term must appear somewhere in the haystack, so
 * "acme berlin" narrows the list rather than widening it the way OR would.
 */
export declare function matchesQuery(haystack: string, query: string): boolean;
/**
 * Inclusive bounds for a preset; a null bound is unbounded on that side.
 * "Last N days" includes today, so `last7` is today plus the six before it.
 */
export declare function rangeBounds(f: Pick<MeetingFilter, 'range' | 'from' | 'to'>, now: Date, trips?: any[]): {
    from: Date | null;
    to: Date | null;
};
/**
 * Applies the whole filter and returns a NEW sorted array, leaving the input
 * untouched. Archived meetings are excluded unless asked for.
 */
export declare function filterMeetings<T extends Record<string, any>>(meetings: T[], f: MeetingFilter, now: Date, includeArchived?: boolean, trips?: any[]): T[];
/**
 * The short "recent activity" view used by the dashboard summaries, where the
 * full list lives behind its own page.
 *
 * Upcoming meetings come first, soonest first, because those are the ones you
 * still have to act on. Past meetings follow, most recent first. Undated
 * meetings sort last. Archived meetings never appear.
 */
export declare function recentMeetings<T extends Record<string, any>>(meetings: T[], now: Date, limit?: number): T[];
/** Counts for the status tabs, computed on the same list the tabs will filter. */
export declare function meetingStatusCounts(meetings: any[], now: Date): Record<StatusFilter, number>;
export type TripStatusFilter = 'all' | 'upcoming' | 'inProgress' | 'past';
export interface TripFilter {
    query: string;
    status: TripStatusFilter;
    sort: SortOrder;
}
export declare const DEFAULT_TRIP_FILTER: TripFilter;
/**
 * A trip's status from its dates. Compared against whole days, so a trip is
 * still "in progress" on its final day rather than flipping to past at midnight.
 */
export declare function tripStatus(t: any, now: Date): 'upcoming' | 'inProgress' | 'past' | 'unknown';
/** Applies the trip filter and returns a NEW sorted array. */
export declare function filterTrips<T extends Record<string, any>>(trips: T[], f: TripFilter, now: Date, includeArchived?: boolean): T[];
/**
 * The most recently finished trip, or null. Drives the "last trip" range.
 */
export declare function lastPastTrip(trips: any[], now: Date): any | null;
export interface ExpenseFilter {
    query: string;
    range: DateRangePreset;
    from?: string;
    to?: string;
    sort: SortOrder;
}
export declare const DEFAULT_EXPENSE_FILTER: ExpenseFilter;
export declare function activeExpenseFilterCount(f: ExpenseFilter): number;
/** An expense's day. Accepts the string forms both platforms write. */
export declare function expenseDate(e: any): Date | null;
export declare function expenseHaystack(e: any): string;
/** Applies the expense filter and returns a NEW sorted array. */
export declare function filterExpenses<T extends Record<string, any>>(expenses: T[], f: ExpenseFilter, now: Date, trips?: any[]): T[];
/**
 * A report is about a trip, so it is filed under the trip's dates when they
 * are known; otherwise under the day it was generated.
 */
export declare function reportDate(r: any): Date | null;
export declare function reportHaystack(r: any): string;
/** Applies the (expense-shaped) filter to trip reports; returns a NEW sorted array. */
export declare function filterReports<T extends Record<string, any>>(reports: T[], f: ExpenseFilter, now: Date, trips?: any[]): T[];
export interface TripGroup<T> {
    /** Trip id, or 'none' for records that belong to no trip. */
    key: string;
    trip: any | null;
    items: T[];
}
/**
 * Buckets records under the trip they belong to — by `tripId`, or failing that
 * by falling inside a trip's dates. Groups come most recent trip first, with
 * unassigned records last. Record order within a group is preserved, so sort
 * before grouping.
 */
export declare function groupByTrip<T extends Record<string, any>>(records: T[], trips: any[], when: (r: T) => Date | null): TripGroup<T>[];
/** Counts for the trip status tabs. */
export declare function tripStatusCounts(trips: any[], now: Date): Record<TripStatusFilter, number>;
