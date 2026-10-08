/**
 * Shared rides — pure matching rules.
 *
 * Two members landing at the same airport within a short window, heading to
 * first destinations near each other, could share one car. Only members who
 * opted in are considered; preferences narrow who may be matched with whom.
 * The identifying details are revealed only after both accept (not here).
 */
import { calculateDistance } from './distanceUtils';

export type RideScope = 'any' | 'industry' | 'company' | 'directory';

export interface RideCandidate {
  uid: string;
  airport: string;                 // IATA
  /** Landing instant, epoch ms (scheduled or live-expected). */
  landsAt: number;
  flightId: string;
  tripId?: string | null;
  /** First destination after landing (hotel or first meeting). */
  dest: { lat: number; lng: number; label: string; areaLabel?: string };
  prefs: { scope: RideScope; industry?: string | null; company?: string | null; directoryListed?: boolean };
}

export interface RideMatch {
  id: string;
  airport: string;
  a: RideCandidate; b: RideCandidate;
  /** Minutes between the two landings. */
  gapMin: number;
  /** Distance between the two first destinations, km. */
  destKm: number;
  /** When the later of the two is expected at the kerb (landing + dwell), epoch ms. */
  meetAt: number;
  score: number;
}

export const MAX_GAP_MIN = 25;
export const MAX_DEST_KM = 4;
export const DEFAULT_DWELL_MIN = 35;

const norm = (s?: string | null) => String(s || '').trim().toLowerCase();

/** May these two be matched, given each one's scope? Both sides' rules must allow it. */
export function scopeAllows(x: RideCandidate, y: RideCandidate): boolean {
  const ok = (me: RideCandidate, other: RideCandidate) => {
    switch (me.prefs.scope) {
      case 'company': return !!norm(me.prefs.company) && norm(me.prefs.company) === norm(other.prefs.company);
      case 'industry': return !!norm(me.prefs.industry) && norm(me.prefs.industry) === norm(other.prefs.industry);
      case 'directory': return !!other.prefs.directoryListed;
      default: return true;
    }
  };
  return ok(x, y) && ok(y, x);
}

export const matchId = (a: string, b: string, airport: string, day: string) => `${[a, b].sort().join('__')}__${airport}__${day}`;

/**
 * Pair up candidates at one airport. Greedy by score so each person is in at
 * most one match per landing; never pairs someone with themselves or with a
 * uid in their blocked set.
 */
export function findRideMatches(cands: RideCandidate[], blocked: Record<string, Set<string>> = {}, dwellMin = DEFAULT_DWELL_MIN, opts: { maxGapMin?: number; maxDestKm?: number } = {}): RideMatch[] {
  const maxGap = opts.maxGapMin ?? MAX_GAP_MIN, maxKm = opts.maxDestKm ?? MAX_DEST_KM;
  const pairs: RideMatch[] = [];
  for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) {
    const a = cands[i], b = cands[j];
    if (a.uid === b.uid || a.airport !== b.airport) continue;
    if (blocked[a.uid]?.has(b.uid) || blocked[b.uid]?.has(a.uid)) continue;
    const gapMin = Math.abs(a.landsAt - b.landsAt) / 60000; if (gapMin > maxGap) continue;
    const destKm = calculateDistance({ latitude: a.dest.lat, longitude: a.dest.lng }, { latitude: b.dest.lat, longitude: b.dest.lng }); if (destKm > maxKm) continue;
    if (!scopeAllows(a, b)) continue;
    const later = Math.max(a.landsAt, b.landsAt);
    const day = new Date(later).toISOString().slice(0, 10);
    const score = 100 - gapMin * 2 - destKm * 5 + (a.prefs.company && norm(a.prefs.company) === norm(b.prefs.company) ? 15 : 0) + (a.prefs.industry && norm(a.prefs.industry) === norm(b.prefs.industry) ? 5 : 0);
    pairs.push({ id: matchId(a.uid, b.uid, a.airport, day), airport: a.airport, a, b, gapMin: Math.round(gapMin), destKm: Math.round(destKm * 10) / 10, meetAt: later + dwellMin * 60000, score });
  }
  pairs.sort((x, y) => y.score - x.score);
  const used = new Set<string>(); const out: RideMatch[] = [];
  for (const p of pairs) { if (used.has(p.a.uid) || used.has(p.b.uid)) continue; used.add(p.a.uid); used.add(p.b.uid); out.push(p); }
  return out;
}

/** The anonymous proposal one side sees before mutual acceptance: timing and area, nothing identifying. */
export function anonymousProposal(m: RideMatch, forUid: string): { airport: string; otherLandsInMin: number; otherArea: string; meetAt: number; sharedIndustry: boolean } {
  const me = m.a.uid === forUid ? m.a : m.b; const other = m.a.uid === forUid ? m.b : m.a;
  return { airport: m.airport, otherLandsInMin: Math.round((other.landsAt - me.landsAt) / 60000), otherArea: other.dest.areaLabel || other.dest.label, meetAt: m.meetAt, sharedIndustry: !!norm(me.prefs.industry) && norm(me.prefs.industry) === norm(other.prefs.industry) };
}
