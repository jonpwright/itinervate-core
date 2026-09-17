"use strict";
/**
 * Wall-clock → instant, in a named time zone, with no dependencies.
 *
 * A meeting is stored as the venue's wall clock ("2026-09-16", "11:30") plus an
 * IANA zone ("Asia/Singapore"). Deciding whether it is past, or how long until
 * it starts, must happen in THAT zone — not the phone's. A traveller looking at
 * Singapore meetings from Sydney (UTC+10 vs +8) was otherwise shown meetings as
 * "past" two hours early.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTimeZone = isValidTimeZone;
exports.tzOffsetMinutes = tzOffsetMinutes;
exports.zonedWallClockToInstant = zonedWallClockToInstant;
exports.tzShortName = tzShortName;
exports.gmtOffsetLabel = gmtOffsetLabel;
exports.zoneName = zoneName;
exports.zonedTimeLabel = zonedTimeLabel;
const dtfCache = new Map();
function dtf(tz) {
    let f = dtfCache.get(tz);
    if (!f) {
        f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        dtfCache.set(tz, f);
    }
    return f;
}
/** Is this a zone Intl knows about? */
function isValidTimeZone(tz) {
    if (typeof tz !== 'string' || !tz.includes('/') && tz !== 'UTC')
        return false;
    try {
        dtf(tz);
        return true;
    }
    catch {
        return false;
    }
}
/** Offset of `tz` from UTC, in minutes, at the given instant (east positive). */
function tzOffsetMinutes(tz, at) {
    const p = {};
    for (const part of dtf(tz).formatToParts(at))
        if (part.type !== 'literal')
            p[part.type] = Number(part.value);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
    return Math.round((asUtc - at.getTime()) / 60000);
}
/** The instant at which `date` `time` occurs on the wall clock of `tz`. */
function zonedWallClockToInstant(date, time, tz) {
    const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d)
        return null;
    let hh = 0, mm = 0;
    if (time) {
        const [h, mi] = String(time).split(':').map(Number);
        if (!Number.isNaN(h))
            hh = h;
        if (!Number.isNaN(mi))
            mm = mi;
    }
    const guess = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
    // Two passes handle a DST transition between the guess and the answer.
    let offset = tzOffsetMinutes(tz, new Date(guess));
    let instant = guess - offset * 60000;
    offset = tzOffsetMinutes(tz, new Date(instant));
    instant = guess - offset * 60000;
    const out = new Date(instant);
    return Number.isNaN(out.getTime()) ? null : out;
}
/** Short label like "SGT" / "GMT+8" for a zone at an instant, for showing the user. */
function tzShortName(tz, at = new Date()) {
    try {
        const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(at).find((x) => x.type === 'timeZoneName');
        return part?.value || tz;
    }
    catch {
        return tz;
    }
}
/** "GMT+8", "GMT+5:30", "GMT-4" — the offset of `tz` at an instant, for humans. */
function gmtOffsetLabel(tz, at = new Date()) {
    const m = tzOffsetMinutes(tz, at);
    const sign = m < 0 ? '-' : '+';
    const a = Math.abs(m);
    return `GMT${sign}${Math.floor(a / 60)}${a % 60 ? `:${String(a % 60).padStart(2, '0')}` : ''}`;
}
/**
 * A human name for a zone: its abbreviation when the runtime knows one ("AEST",
 * "JST"), else the IANA city ("Tokyo"). React Native's engine often only knows
 * "GMT+9", which would read "GMT+9 (GMT+9)" — the city is friendlier anyway.
 */
function zoneName(tz, at = new Date()) {
    const abbr = tzShortName(tz, at);
    if (/^[A-Z]{2,5}$/.test(abbr) && !/^(GMT|UTC)$/.test(abbr))
        return abbr;
    return tz.split('/').pop().replace(/_/g, ' ');
}
/**
 * Label a stored wall-clock time (date, HH:mm) in its own zone, and translate it
 * to the viewer's zone when that differs. Meetings use the venue's zone, flights
 * the airport's — so a Singapore 11:30 is shown as "11:30 SGT (GMT+8)" and, to a
 * viewer in Sydney, also "13:30 AEST (GMT+10)".
 */
function zonedTimeLabel(date, time, tz, viewerTz) {
    const t = time || '';
    if (!date || !t || !isValidTimeZone(tz))
        return { time: t, zone: '', viewer: null, viewerDayShift: '', instant: null };
    const at = zonedWallClockToInstant(date, t, tz);
    if (!at)
        return { time: t, zone: '', viewer: null, viewerDayShift: '', instant: null };
    const zone = `${zoneName(tz, at)} (${gmtOffsetLabel(tz, at)})`;
    let viewer = null;
    let viewerDayShift = '';
    if (viewerTz && isValidTimeZone(viewerTz) && tzOffsetMinutes(viewerTz, at) !== tzOffsetMinutes(tz, at)) {
        const f = new Intl.DateTimeFormat('en-GB', { timeZone: viewerTz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        viewer = `${f.format(at)} ${zoneName(viewerTz, at)} (${gmtOffsetLabel(viewerTz, at)})`;
        const dayIn = (z) => new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
        const dv = dayIn(viewerTz), dz = dayIn(tz);
        viewerDayShift = dv > dz ? '+1' : dv < dz ? '-1' : '';
    }
    return { time: t, zone, viewer, viewerDayShift, instant: at };
}
