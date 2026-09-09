"use strict";
// Shared meeting-debrief model — mirrors itinervate-website/lib/meetingDebrief.ts
// so ROI scoring and factor ids stay identical across web and mobile.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBRIEF_DEFAULT_VALUE = exports.DEBRIEF_FACTORS = exports.DEBRIEF_SCALE_MAX = exports.DEBRIEF_SCALE_MIN = void 0;
exports.createDefaultRatings = createDefaultRatings;
exports.computeRoiScore = computeRoiScore;
exports.roiScoreLabel = roiScoreLabel;
exports.roiScoreColor = roiScoreColor;
exports.DEBRIEF_SCALE_MIN = 1;
exports.DEBRIEF_SCALE_MAX = 10;
/**
 * Sliding-scale factors the user rates after a meeting. Weights bias the overall
 * ROI-potential score toward the factors that most drive revenue outcomes.
 * `id` values are persisted in Firestore — do not rename once shipped.
 */
exports.DEBRIEF_FACTORS = [
    { id: 'overall', label: 'Overall outcome', description: 'How did the meeting go overall?', minLabel: 'Poor', maxLabel: 'Excellent', weight: 1 },
    { id: 'objectives', label: 'Objectives achieved', description: 'Did you accomplish what you set out to?', minLabel: 'None met', maxLabel: 'Fully met', weight: 1 },
    { id: 'engagement', label: 'Client engagement', description: 'How engaged and interested were the attendees?', minLabel: 'Disengaged', maxLabel: 'Highly engaged', weight: 1 },
    { id: 'scopeForMore', label: 'Scope for more work', description: 'Is there opportunity for additional or follow-on work?', minLabel: 'None', maxLabel: 'Significant', weight: 1.5 },
    { id: 'dealLikelihood', label: 'Deal likelihood', description: 'How likely is this to convert into business?', minLabel: 'Unlikely', maxLabel: 'Very likely', weight: 1.5 },
    { id: 'relationship', label: 'Relationship strength', description: 'How strong is the relationship / rapport built?', minLabel: 'Weak', maxLabel: 'Strong', weight: 1 },
    { id: 'urgency', label: 'Timeline / urgency', description: 'How urgent is the prospect\u2019s need or timeline?', minLabel: 'No urgency', maxLabel: 'Immediate', weight: 1 },
];
/** Sensible neutral default for a fresh, un-rated debrief. */
exports.DEBRIEF_DEFAULT_VALUE = 5;
function createDefaultRatings() {
    return exports.DEBRIEF_FACTORS.reduce((acc, f) => {
        acc[f.id] = exports.DEBRIEF_DEFAULT_VALUE;
        return acc;
    }, {});
}
/**
 * Weighted average of the factor ratings, normalised to a 0-100 ROI-potential
 * score. Only known factors contribute so the scale stays stable if factors are
 * added/removed over time.
 */
function computeRoiScore(ratings) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const factor of exports.DEBRIEF_FACTORS) {
        const value = ratings[factor.id];
        if (typeof value !== 'number' || Number.isNaN(value))
            continue;
        weightedSum += value * factor.weight;
        weightTotal += factor.weight;
    }
    if (weightTotal === 0)
        return 0;
    const avg = weightedSum / weightTotal; // 1..10
    return Math.round(((avg - exports.DEBRIEF_SCALE_MIN) / (exports.DEBRIEF_SCALE_MAX - exports.DEBRIEF_SCALE_MIN)) * 100);
}
/** Human-friendly band for an ROI-potential score. */
function roiScoreLabel(score) {
    if (score >= 75)
        return 'High ROI potential';
    if (score >= 50)
        return 'Moderate ROI potential';
    if (score >= 25)
        return 'Low ROI potential';
    return 'Minimal ROI potential';
}
function roiScoreColor(score) {
    if (score >= 75)
        return '#4ade80';
    if (score >= 50)
        return '#9ae9ff';
    if (score >= 25)
        return '#facc15';
    return '#94a3b8';
}
