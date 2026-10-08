"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNKNOWN = exports.MIN_DECIDED_SEGMENTS = exports.LABEL_MAJORITY = exports.PROXIMITY_MARGIN_DB = void 0;
exports.meanDb = meanDb;
exports.nearestDevice = nearestDevice;
exports.attributeSegments = attributeSegments;
exports.attributedTranscript = attributedTranscript;
exports.PROXIMITY_MARGIN_DB = 3; // the nearest phone must be this much louder than the next
exports.LABEL_MAJORITY = 0.6; // a label is named when an owner wins this share of its decided segments
exports.MIN_DECIDED_SEGMENTS = 2; // and at least this many were decided
exports.UNKNOWN = 'A participant';
/** Mean loudness of a device over a window; null when it heard nothing in it. */
function meanDb(samples, fromMs, toMs) {
    let sum = 0, n = 0;
    for (const s of samples)
        if (s.t >= fromMs && s.t <= toMs && Number.isFinite(s.db)) {
            sum += s.db;
            n++;
        }
    return n ? sum / n : null;
}
/** Which phone heard this window loudest, by a clear margin. */
function nearestDevice(devices, fromMs, toMs, marginDb = exports.PROXIMITY_MARGIN_DB) {
    const scored = devices.map((d) => ({ d, db: meanDb(d.samples, fromMs, toMs) })).filter((x) => x.db != null).sort((a, b) => b.db - a.db);
    if (!scored.length)
        return null;
    if (scored.length === 1)
        return null; // one phone proves nothing about proximity
    const margin = scored[0].db - scored[1].db;
    return margin >= marginDb ? { uid: scored[0].d.uid, name: scored[0].d.name, marginDb: margin } : null;
}
/**
 * Attribute every segment. `sessionStartMs` anchors the segments' second offsets to the meters' epoch times.
 * Pure; deterministic.
 */
function attributeSegments(segments, devices, sessionStartMs) {
    // 1. Per-segment proximity decision.
    const decided = segments.map((s) => { const hit = nearestDevice(devices, sessionStartMs + s.start * 1000, sessionStartMs + s.end * 1000); return { s, hit }; });
    // 2. Per-label consensus: who owns speaker "A"?
    const byLabel = new Map();
    const totals = new Map();
    for (const { s, hit } of decided) {
        totals.set(s.speaker, (totals.get(s.speaker) || 0) + 1);
        if (!hit)
            continue;
        const m = byLabel.get(s.speaker) || new Map();
        const cur = m.get(hit.uid) || { name: hit.name, n: 0, margin: 0 };
        cur.n++;
        cur.margin += hit.marginDb;
        m.set(hit.uid, cur);
        byLabel.set(s.speaker, m);
    }
    const labels = [];
    const resolved = new Map();
    const takenOwners = new Set();
    // Strongest labels first so an owner is not handed to two labels.
    const order = Array.from(totals.keys()).sort((a, b) => (totals.get(b) || 0) - (totals.get(a) || 0));
    for (const label of order) {
        const votes = byLabel.get(label);
        const total = totals.get(label) || 0;
        let res = { label, name: exports.UNKNOWN, confidence: 0, segments: total };
        if (votes) {
            const decidedN = Array.from(votes.values()).reduce((a, v) => a + v.n, 0);
            const [bestUid, best] = Array.from(votes.entries()).filter(([uid]) => !takenOwners.has(uid)).sort((a, b) => b[1].n - a[1].n)[0] || [];
            if (bestUid && best && decidedN >= exports.MIN_DECIDED_SEGMENTS && best.n / decidedN >= exports.LABEL_MAJORITY) {
                // Share of the label's decided segments, tempered by how many there were and how clear the loudness margin was.
                const share = best.n / decidedN;
                const sampleFactor = Math.min(1, 0.6 + decidedN * 0.1);
                const marginFactor = Math.min(1, 0.7 + (best.margin / best.n) / 20);
                const confidence = Math.min(1, share * sampleFactor * marginFactor);
                res = { label, uid: bestUid, name: best.name, confidence: Math.round(confidence * 100) / 100, segments: total };
                takenOwners.add(bestUid);
            }
        }
        labels.push(res);
        resolved.set(label, res);
    }
    // 3. Apply: a decided segment keeps its own hit when it agrees with the label; otherwise the label's owner; otherwise unknown.
    const out = decided.map(({ s, hit }) => {
        const lab = resolved.get(s.speaker);
        if (lab.uid)
            return { ...s, uid: lab.uid, name: lab.name, confidence: lab.confidence };
        if (hit)
            return { ...s, uid: hit.uid, name: hit.name, confidence: Math.min(0.59, 0.3 + hit.marginDb / 20) }; // a lone proximity hit: weak, below the naming bar
        return { ...s, name: exports.UNKNOWN, confidence: 0 };
    });
    return { segments: out, labels };
}
/** Transcript lines for the summariser: names only where the floor is met, otherwise "A participant". */
function attributedTranscript(segments, floor = exports.LABEL_MAJORITY) {
    const lines = [];
    let last = '';
    for (const s of segments) {
        const who = s.confidence >= floor ? s.name : exports.UNKNOWN;
        if (who === last && lines.length)
            lines[lines.length - 1] += ` ${s.text.trim()}`;
        else {
            lines.push(`${who}: ${s.text.trim()}`);
            last = who;
        }
    }
    return lines.join('\n');
}
