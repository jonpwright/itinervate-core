/**
 * Wall-clock → instant, in a named time zone, with no dependencies.
 *
 * A meeting is stored as the venue's wall clock ("2026-09-16", "11:30") plus an
 * IANA zone ("Asia/Singapore"). Deciding whether it is past, or how long until
 * it starts, must happen in THAT zone — not the phone's. A traveller looking at
 * Singapore meetings from Sydney (UTC+10 vs +8) was otherwise shown meetings as
 * "past" two hours early.
 */
/** Is this a zone Intl knows about? */
export declare function isValidTimeZone(tz: unknown): tz is string;
/** Offset of `tz` from UTC, in minutes, at the given instant (east positive). */
export declare function tzOffsetMinutes(tz: string, at: Date): number;
/** The instant at which `date` `time` occurs on the wall clock of `tz`. */
export declare function zonedWallClockToInstant(date: string, time: string | undefined, tz: string): Date | null;
/** Short label like "SGT" / "GMT+8" for a zone at an instant, for showing the user. */
export declare function tzShortName(tz: string, at?: Date): string;
