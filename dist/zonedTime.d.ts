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
/** "GMT+8", "GMT+5:30", "GMT-4" — the offset of `tz` at an instant, for humans. */
export declare function gmtOffsetLabel(tz: string, at?: Date): string;
/**
 * A human name for a zone: its abbreviation when the runtime knows one ("AEST",
 * "JST"), else the IANA city ("Tokyo"). React Native's engine often only knows
 * "GMT+9", which would read "GMT+9 (GMT+9)" — the city is friendlier anyway.
 */
export declare function zoneName(tz: string, at?: Date): string;
export interface ZonedTimeLabel {
    /** e.g. "11:30" — the wall clock where it happens */
    time: string;
    /** e.g. "SGT (GMT+8)" */
    zone: string;
    /** e.g. "13:30 AEST (GMT+10)" — the same instant on the viewer's clock, or null when it is the same zone/offset */
    viewer: string | null;
    /** "+1" / "-1" when the viewer's calendar day differs from the venue's, else "" */
    viewerDayShift: string;
    instant: Date | null;
}
/**
 * Label a stored wall-clock time (date, HH:mm) in its own zone, and translate it
 * to the viewer's zone when that differs. Meetings use the venue's zone, flights
 * the airport's — so a Singapore 11:30 is shown as "11:30 SGT (GMT+8)" and, to a
 * viewer in Sydney, also "13:30 AEST (GMT+10)".
 */
export declare function zonedTimeLabel(date: string | undefined, time: string | undefined, tz: string | undefined, viewerTz?: string): ZonedTimeLabel;
