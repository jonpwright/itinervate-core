export type RideScope = 'any' | 'industry' | 'company' | 'directory';
export interface RideCandidate {
    uid: string;
    airport: string;
    /** Landing instant, epoch ms (scheduled or live-expected). */
    landsAt: number;
    flightId: string;
    tripId?: string | null;
    /** First destination after landing (hotel or first meeting). */
    dest: {
        lat: number;
        lng: number;
        label: string;
        areaLabel?: string;
    };
    prefs: {
        scope: RideScope;
        industry?: string | null;
        company?: string | null;
        directoryListed?: boolean;
    };
}
export interface RideMatch {
    id: string;
    airport: string;
    a: RideCandidate;
    b: RideCandidate;
    /** Minutes between the two landings. */
    gapMin: number;
    /** Distance between the two first destinations, km. */
    destKm: number;
    /** When the later of the two is expected at the kerb (landing + dwell), epoch ms. */
    meetAt: number;
    score: number;
}
export declare const MAX_GAP_MIN = 25;
export declare const MAX_DEST_KM = 4;
export declare const DEFAULT_DWELL_MIN = 35;
/** May these two be matched, given each one's scope? Both sides' rules must allow it. */
export declare function scopeAllows(x: RideCandidate, y: RideCandidate): boolean;
export declare const matchId: (a: string, b: string, airport: string, day: string) => string;
/**
 * Pair up candidates at one airport. Greedy by score so each person is in at
 * most one match per landing; never pairs someone with themselves or with a
 * uid in their blocked set.
 */
export declare function findRideMatches(cands: RideCandidate[], blocked?: Record<string, Set<string>>, dwellMin?: number, opts?: {
    maxGapMin?: number;
    maxDestKm?: number;
}): RideMatch[];
/** The anonymous proposal one side sees before mutual acceptance: timing and area, nothing identifying. */
export declare function anonymousProposal(m: RideMatch, forUid: string): {
    airport: string;
    otherLandsInMin: number;
    otherArea: string;
    meetAt: number;
    sharedIndustry: boolean;
};
