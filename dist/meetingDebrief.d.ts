export interface MeetingDebriefFactor {
    id: string;
    label: string;
    description: string;
    minLabel: string;
    maxLabel: string;
    weight: number;
}
export interface MeetingDebrief {
    ratings: Record<string, number>;
    notes?: string;
    roiScore?: number;
    completedAt: string;
}
export declare const DEBRIEF_SCALE_MIN = 1;
export declare const DEBRIEF_SCALE_MAX = 10;
/**
 * Sliding-scale factors the user rates after a meeting. Weights bias the overall
 * ROI-potential score toward the factors that most drive revenue outcomes.
 * `id` values are persisted in Firestore — do not rename once shipped.
 */
export declare const DEBRIEF_FACTORS: MeetingDebriefFactor[];
/** Sensible neutral default for a fresh, un-rated debrief. */
export declare const DEBRIEF_DEFAULT_VALUE = 5;
export declare function createDefaultRatings(): Record<string, number>;
/**
 * Weighted average of the factor ratings, normalised to a 0-100 ROI-potential
 * score. Only known factors contribute so the scale stays stable if factors are
 * added/removed over time.
 */
export declare function computeRoiScore(ratings: Record<string, number>): number;
/** Human-friendly band for an ROI-potential score. */
export declare function roiScoreLabel(score: number): string;
export declare function roiScoreColor(score: number): string;
