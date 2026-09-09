"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXPENSE_FILTER = exports.DEFAULT_TRIP_FILTER = exports.DEFAULT_MEETING_FILTER = void 0;
exports.activeFilterCount = activeFilterCount;
exports.toDayString = toDayString;
exports.parseLocalDateTime = parseLocalDateTime;
exports.meetingStart = meetingStart;
exports.meetingEnd = meetingEnd;
exports.isPastMeeting = isPastMeeting;
exports.hasDebrief = hasDebrief;
exports.isConfirmed = isConfirmed;
exports.isArchived = isArchived;
exports.attendeeNames = attendeeNames;
exports.meetingHaystack = meetingHaystack;
exports.tripHaystack = tripHaystack;
exports.matchesQuery = matchesQuery;
exports.rangeBounds = rangeBounds;
exports.filterMeetings = filterMeetings;
exports.recentMeetings = recentMeetings;
exports.meetingStatusCounts = meetingStatusCounts;
exports.tripStatus = tripStatus;
exports.filterTrips = filterTrips;
exports.lastPastTrip = lastPastTrip;
exports.activeExpenseFilterCount = activeExpenseFilterCount;
exports.expenseDate = expenseDate;
exports.expenseHaystack = expenseHaystack;
exports.filterExpenses = filterExpenses;
exports.reportDate = reportDate;
exports.reportHaystack = reportHaystack;
exports.filterReports = filterReports;
exports.groupByTrip = groupByTrip;
exports.tripStatusCounts = tripStatusCounts;
exports.DEFAULT_MEETING_FILTER = {
    query: '',
    range: 'all',
    status: 'all',
    sort: 'newest',
};
/** How many controls are actively narrowing the list, for a badge on the UI. */
function activeFilterCount(f) {
    let n = 0;
    if (f.query.trim())
        n++;
    if (f.range !== 'all')
        n++;
    if (f.status !== 'all')
        n++;
    return n;
}
// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
/** Milliseconds from a Firestore Timestamp (real or serialised) or a Date. */
function timestampMillis(v) {
    if (v instanceof Date)
        return Number.isNaN(v.getTime()) ? null : v.getTime();
    if (typeof v === 'number')
        return Number.isFinite(v) ? v : null;
    if (v && typeof v === 'object') {
        const o = v;
        if (typeof o.toMillis === 'function')
            return o.toMillis();
        if (typeof o.toDate === 'function')
            return o.toDate().getTime();
        const s = o.seconds ?? o._seconds;
        if (typeof s === 'number')
            return s * 1000;
    }
    return null;
}
/**
 * A stored date as "YYYY-MM-DD" in local time, whatever shape it arrived in.
 * For presentation code that wants to slice or compare day strings.
 */
function toDayString(date) {
    if (!date)
        return '';
    if (typeof date === 'string')
        return date.slice(0, 10);
    const ms = timestampMillis(date);
    if (ms == null)
        return '';
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/**
 * Parses a stored "YYYY-MM-DD" (+ optional "HH:MM") as LOCAL wall-clock time.
 *
 * Built from numeric components rather than `new Date(string)` on purpose:
 * `new Date("2026-07-25")` is parsed as UTC midnight and renders as the
 * PREVIOUS day for anyone west of UTC, which would file a meeting under the
 * wrong day and drop it from the wrong end of a range.
 */
function parseLocalDateTime(date, time) {
    if (!date)
        return null;
    if (typeof date !== 'string') {
        // The website writes Firestore Timestamps where the app writes strings.
        // Treated as the local day they fall on, matching the string path.
        const ms = timestampMillis(date);
        if (ms == null)
            return null;
        const at = new Date(ms);
        return parseLocalDateTime(toDayString(at), time ?? `${at.getHours()}:${at.getMinutes()}`);
    }
    const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d)
        return null;
    let hours = 0;
    let minutes = 0;
    if (time) {
        const [h, min] = String(time).split(':').map(Number);
        if (!Number.isNaN(h))
            hours = h;
        if (!Number.isNaN(min))
            minutes = min;
    }
    const parsed = new Date(y, m - 1, d, hours, minutes, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
/** Start of a meeting, or null when it has no usable date. */
function meetingStart(m) {
    return parseLocalDateTime(m?.date, m?.time);
}
/** End of a meeting = start + duration, defaulting to 60 minutes. */
function meetingEnd(m) {
    const start = meetingStart(m);
    if (!start)
        return null;
    return new Date(start.getTime() + (Number(m?.duration) || 60) * 60000);
}
/** True once the meeting's full duration has elapsed. */
function isPastMeeting(m, now) {
    const end = meetingEnd(m);
    if (!end)
        return false;
    return end.getTime() < now.getTime();
}
/**
 * Has this meeting been debriefed? Counts partial saves (a rating or a note),
 * so "needs debrief" does not keep nagging about one already engaged with.
 */
function hasDebrief(m) {
    const d = m?.debrief;
    if (d) {
        if (d.completedAt ||
            d.roiScore != null ||
            d.rating != null ||
            (typeof d.notes === 'string' && d.notes.trim().length > 0) ||
            (d.ratings && typeof d.ratings === 'object' && Object.keys(d.ratings).length > 0)) {
            return true;
        }
    }
    // Older meetings recorded a bare rating on the meeting itself.
    return m?.rating != null;
}
/** True when a stored status counts as confirmed on either platform. */
function isConfirmed(m) {
    const s = String(m?.status || '').toLowerCase();
    return s === 'confirmed' || s === 'approved';
}
/** True when the record is archived and should be hidden by default. */
function isArchived(x) {
    return x?.archived === true || !!x?.archivedAt;
}
// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
/**
 * Attendee names as a flat list, absorbing every shape the platforms use: a
 * comma-separated string (website), an array of objects with name/email
 * (mobile), or an array of plain strings.
 */
function attendeeNames(m) {
    const raw = m?.attendees;
    if (!raw)
        return [];
    if (typeof raw === 'string') {
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(raw)) {
        return raw
            .map((a) => {
            if (typeof a === 'string')
                return a.trim();
            if (a && typeof a === 'object') {
                return String(a.name || a.email || a.displayName || '').trim();
            }
            return '';
        })
            .filter(Boolean);
    }
    return [];
}
/** Everything about a meeting a text search should look inside. */
function meetingHaystack(m) {
    return [
        m?.title,
        m?.company,
        m?.location,
        m?.organizer,
        m?.notes,
        m?.agenda,
        m?.meetingPurpose,
        ...attendeeNames(m),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}
/** Everything about a trip a text search should look inside. */
function tripHaystack(t) {
    return [
        t?.name,
        t?.destinationCity,
        t?.destinationCountry,
        t?.city,
        t?.purpose,
        t?.description,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}
/**
 * Every whitespace-separated term must appear somewhere in the haystack, so
 * "acme berlin" narrows the list rather than widening it the way OR would.
 */
function matchesQuery(haystack, query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0)
        return true;
    return terms.every((term) => haystack.includes(term));
}
// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function daysFrom(d, delta) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
}
/**
 * Inclusive bounds for a preset; a null bound is unbounded on that side.
 * "Last N days" includes today, so `last7` is today plus the six before it.
 */
function rangeBounds(f, now, trips) {
    switch (f.range) {
        case 'lastTrip': {
            // The whole span of the most recently finished trip. With no such trip
            // the window is empty rather than unbounded: "last trip" showing
            // everything would be a wrong answer dressed as a right one.
            const trip = lastPastTrip(trips || [], now);
            const start = trip ? parseLocalDateTime(trip.startDate) : null;
            const end = trip ? parseLocalDateTime(trip.endDate) : null;
            if (!start || !end)
                return { from: new Date(0), to: new Date(0) };
            return { from: startOfDay(start), to: endOfDay(end) };
        }
        case 'next30':
            return { from: startOfDay(now), to: endOfDay(daysFrom(now, 30)) };
        case 'last7':
            return { from: startOfDay(daysFrom(now, -6)), to: endOfDay(now) };
        case 'last30':
            return { from: startOfDay(daysFrom(now, -29)), to: endOfDay(now) };
        case 'last60':
            return { from: startOfDay(daysFrom(now, -59)), to: endOfDay(now) };
        case 'last90':
            return { from: startOfDay(daysFrom(now, -89)), to: endOfDay(now) };
        case 'thisYear':
            return {
                from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
                to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
            };
        case 'custom': {
            const from = f.from ? parseLocalDateTime(f.from) : null;
            const toStart = f.to ? parseLocalDateTime(f.to) : null;
            return { from, to: toStart ? endOfDay(toStart) : null };
        }
        case 'all':
        default:
            return { from: null, to: null };
    }
}
function withinBounds(when, bounds) {
    if (!when) {
        // An undated record cannot be placed in a window, so only an unbounded
        // range keeps it. It stays findable instead of vanishing silently.
        return !bounds.from && !bounds.to;
    }
    if (bounds.from && when.getTime() < bounds.from.getTime())
        return false;
    if (bounds.to && when.getTime() > bounds.to.getTime())
        return false;
    return true;
}
// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------
function matchesStatus(m, status, now) {
    const past = isPastMeeting(m, now);
    switch (status) {
        case 'past':
            return past;
        case 'upcoming':
            return !past;
        case 'confirmed':
            return !past && isConfirmed(m);
        case 'pending':
            return !past && !isConfirmed(m);
        case 'needsDebrief':
            return past && !hasDebrief(m);
        case 'all':
        default:
            return true;
    }
}
function compareMeetings(a, b, sort) {
    if (sort === 'title') {
        return String(a?.title || '').localeCompare(String(b?.title || ''));
    }
    const at = meetingStart(a)?.getTime();
    const bt = meetingStart(b)?.getTime();
    // Undated records sort last whichever direction is chosen, rather than
    // colonising the top of the list.
    if (at == null && bt == null)
        return 0;
    if (at == null)
        return 1;
    if (bt == null)
        return -1;
    return sort === 'oldest' ? at - bt : bt - at;
}
/**
 * Applies the whole filter and returns a NEW sorted array, leaving the input
 * untouched. Archived meetings are excluded unless asked for.
 */
function filterMeetings(meetings, f, now, includeArchived = false, trips) {
    const bounds = rangeBounds(f, now, trips);
    const lastTrip = f.range === 'lastTrip' ? lastPastTrip(trips || [], now) : null;
    const query = f.query.trim();
    return meetings
        .filter((m) => {
        if (!includeArchived && isArchived(m))
            return false;
        if (!matchesStatus(m, f.status, now))
            return false;
        if (!inRangeOrOnTrip(m, meetingStart(m), bounds, lastTrip))
            return false;
        if (query && !matchesQuery(meetingHaystack(m), query))
            return false;
        return true;
    })
        .slice()
        .sort((a, b) => compareMeetings(a, b, f.sort));
}
/**
 * The short "recent activity" view used by the dashboard summaries, where the
 * full list lives behind its own page.
 *
 * Upcoming meetings come first, soonest first, because those are the ones you
 * still have to act on. Past meetings follow, most recent first. Undated
 * meetings sort last. Archived meetings never appear.
 */
function recentMeetings(meetings, now, limit = 6) {
    if (limit <= 0)
        return [];
    const live = meetings.filter((m) => !isArchived(m));
    const upcoming = [];
    const past = [];
    const undated = [];
    for (const m of live) {
        if (meetingStart(m) == null)
            undated.push(m);
        else if (isPastMeeting(m, now))
            past.push(m);
        else
            upcoming.push(m);
    }
    upcoming.sort((a, b) => compareMeetings(a, b, 'oldest'));
    past.sort((a, b) => compareMeetings(a, b, 'newest'));
    return [...upcoming, ...past, ...undated].slice(0, limit);
}
/** Counts for the status tabs, computed on the same list the tabs will filter. */
function meetingStatusCounts(meetings, now) {
    const live = meetings.filter((m) => !isArchived(m));
    return {
        all: live.length,
        upcoming: live.filter((m) => matchesStatus(m, 'upcoming', now)).length,
        past: live.filter((m) => matchesStatus(m, 'past', now)).length,
        confirmed: live.filter((m) => matchesStatus(m, 'confirmed', now)).length,
        pending: live.filter((m) => matchesStatus(m, 'pending', now)).length,
        needsDebrief: live.filter((m) => matchesStatus(m, 'needsDebrief', now)).length,
    };
}
exports.DEFAULT_TRIP_FILTER = {
    query: '',
    status: 'all',
    sort: 'newest',
};
/**
 * A trip's status from its dates. Compared against whole days, so a trip is
 * still "in progress" on its final day rather than flipping to past at midnight.
 */
function tripStatus(t, now) {
    const start = parseLocalDateTime(t?.startDate);
    const end = parseLocalDateTime(t?.endDate);
    if (!start || !end)
        return 'unknown';
    const today = startOfDay(now).getTime();
    if (endOfDay(end).getTime() < today)
        return 'past';
    if (startOfDay(start).getTime() > today)
        return 'upcoming';
    return 'inProgress';
}
function compareTrips(a, b, sort) {
    if (sort === 'title') {
        return String(a?.name || '').localeCompare(String(b?.name || ''));
    }
    const at = parseLocalDateTime(a?.startDate)?.getTime();
    const bt = parseLocalDateTime(b?.startDate)?.getTime();
    if (at == null && bt == null)
        return 0;
    if (at == null)
        return 1;
    if (bt == null)
        return -1;
    return sort === 'oldest' ? at - bt : bt - at;
}
/** Applies the trip filter and returns a NEW sorted array. */
function filterTrips(trips, f, now, includeArchived = false) {
    const query = f.query.trim();
    return trips
        .filter((t) => {
        if (!includeArchived && isArchived(t))
            return false;
        if (f.status !== 'all' && tripStatus(t, now) !== f.status)
            return false;
        if (query && !matchesQuery(tripHaystack(t), query))
            return false;
        return true;
    })
        .slice()
        .sort((a, b) => compareTrips(a, b, f.sort));
}
/**
 * The most recently finished trip, or null. Drives the "last trip" range.
 */
function lastPastTrip(trips, now) {
    let best = null;
    let bestEnd = -Infinity;
    for (const t of trips) {
        if (isArchived(t) || tripStatus(t, now) !== 'past')
            continue;
        const end = parseLocalDateTime(t.endDate)?.getTime() ?? -Infinity;
        if (end > bestEnd) {
            best = t;
            bestEnd = end;
        }
    }
    return best;
}
/**
 * A record belongs to the "last trip" window if it is linked to that trip by
 * id, or — lacking a link — falls inside the trip's dates. Other ranges use
 * dates alone.
 */
function inRangeOrOnTrip(record, when, bounds, lastTrip) {
    if (lastTrip) {
        if (record?.tripId === lastTrip.id)
            return true;
        if (record?.tripId)
            return false;
    }
    return withinBounds(when, bounds);
}
exports.DEFAULT_EXPENSE_FILTER = {
    query: '',
    range: 'all',
    sort: 'newest',
};
function activeExpenseFilterCount(f) {
    let n = 0;
    if (f.query.trim())
        n++;
    if (f.range !== 'all')
        n++;
    return n;
}
/** An expense's day. Accepts the string forms both platforms write. */
function expenseDate(e) {
    const day = toDayString(e?.date);
    return day ? parseLocalDateTime(day) : null;
}
function expenseHaystack(e) {
    return [e?.description, e?.category, e?.merchant, e?.vendor, e?.notes, e?.amount, e?.currency]
        .filter((v) => v != null && v !== '')
        .join(' ')
        .toLowerCase();
}
function compareExpenses(a, b, sort) {
    if (sort === 'title') {
        return String(a?.description || '').localeCompare(String(b?.description || ''));
    }
    const at = expenseDate(a)?.getTime();
    const bt = expenseDate(b)?.getTime();
    if (at == null && bt == null)
        return 0;
    if (at == null)
        return 1;
    if (bt == null)
        return -1;
    return sort === 'oldest' ? at - bt : bt - at;
}
/** Applies the expense filter and returns a NEW sorted array. */
function filterExpenses(expenses, f, now, trips) {
    const bounds = rangeBounds(f, now, trips);
    const lastTrip = f.range === 'lastTrip' ? lastPastTrip(trips || [], now) : null;
    const query = f.query.trim();
    return expenses
        .filter((e) => {
        if (!inRangeOrOnTrip(e, expenseDate(e), bounds, lastTrip))
            return false;
        if (query && !matchesQuery(expenseHaystack(e), query))
            return false;
        return true;
    })
        .slice()
        .sort((a, b) => compareExpenses(a, b, f.sort));
}
// ---------------------------------------------------------------------------
// Trip reports
// ---------------------------------------------------------------------------
/**
 * A report is about a trip, so it is filed under the trip's dates when they
 * are known; otherwise under the day it was generated.
 */
function reportDate(r) {
    const day = toDayString(r?.startDate) || toDayString(r?.generatedAt);
    return day ? parseLocalDateTime(day) : null;
}
function reportHaystack(r) {
    return [r?.tripName, r?.destinationCity, r?.destinationCountry, r?.type]
        .filter((v) => v != null && v !== '')
        .join(' ')
        .toLowerCase();
}
function compareReports(a, b, sort) {
    if (sort === 'title') {
        return String(a?.tripName || '').localeCompare(String(b?.tripName || ''));
    }
    const at = reportDate(a)?.getTime();
    const bt = reportDate(b)?.getTime();
    if (at == null && bt == null)
        return 0;
    if (at == null)
        return 1;
    if (bt == null)
        return -1;
    return sort === 'oldest' ? at - bt : bt - at;
}
/** Applies the (expense-shaped) filter to trip reports; returns a NEW sorted array. */
function filterReports(reports, f, now, trips) {
    const bounds = rangeBounds(f, now, trips);
    const lastTrip = f.range === 'lastTrip' ? lastPastTrip(trips || [], now) : null;
    const query = f.query.trim();
    return reports
        .filter((r) => {
        if (!inRangeOrOnTrip(r, reportDate(r), bounds, lastTrip))
            return false;
        if (query && !matchesQuery(reportHaystack(r), query))
            return false;
        return true;
    })
        .slice()
        .sort((a, b) => compareReports(a, b, f.sort));
}
/**
 * Buckets records under the trip they belong to — by `tripId`, or failing that
 * by falling inside a trip's dates. Groups come most recent trip first, with
 * unassigned records last. Record order within a group is preserved, so sort
 * before grouping.
 */
function groupByTrip(records, trips, when) {
    const byId = new Map();
    for (const t of trips)
        if (t?.id)
            byId.set(t.id, t);
    const groups = new Map();
    const place = (key, trip, r) => {
        let g = groups.get(key);
        if (!g) {
            g = { key, trip, items: [] };
            groups.set(key, g);
        }
        g.items.push(r);
    };
    for (const r of records) {
        const linked = r.tripId ? byId.get(r.tripId) : null;
        if (linked) {
            place(linked.id, linked, r);
            continue;
        }
        const at = when(r)?.getTime();
        const host = at == null
            ? null
            : trips.find((t) => {
                const s = parseLocalDateTime(t?.startDate);
                const e = parseLocalDateTime(t?.endDate);
                return s && e && at >= startOfDay(s).getTime() && at <= endOfDay(e).getTime();
            });
        if (host)
            place(host.id, host, r);
        else
            place('none', null, r);
    }
    return Array.from(groups.values()).sort((a, b) => {
        if (!a.trip)
            return 1;
        if (!b.trip)
            return -1;
        const at = parseLocalDateTime(a.trip.startDate)?.getTime() ?? 0;
        const bt = parseLocalDateTime(b.trip.startDate)?.getTime() ?? 0;
        return bt - at;
    });
}
/** Counts for the trip status tabs. */
function tripStatusCounts(trips, now) {
    const live = trips.filter((t) => !isArchived(t));
    return {
        all: live.length,
        upcoming: live.filter((t) => tripStatus(t, now) === 'upcoming').length,
        inProgress: live.filter((t) => tripStatus(t, now) === 'inProgress').length,
        past: live.filter((t) => tripStatus(t, now) === 'past').length,
    };
}
