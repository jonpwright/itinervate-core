/**
 * Who said what — from several consenting phones in the same room.
 *
 * Inputs, all lawful once everyone opted in and none of them biometric:
 *   - diarised segments from one stream (speaker labels A, B, … with times)
 *   - loudness meters from every recording phone (dB samples over time)
 *
 * Rule: the phone that heard a segment loudest is the speaker's own phone —
 * people hold or sit nearest their own device. A segment is attributed to that
 * phone's owner only when it beat the runner-up by a clear margin. Then the
 * diarisation label's attributions are tallied: a label is named after an owner
 * when that owner wins a clear majority of its attributed segments. Anything
 * below the floor is "a participant". Attributions are never guessed.
 */
export interface DiarizedSegment { speaker: string; start: number; end: number; text: string }   // seconds, absolute to the session
export interface MeterSample { t: number; db: number }                                            // epoch ms, dBFS (negative; 0 is loudest)
export interface DeviceMeter { uid: string; name: string; samples: MeterSample[] }

export interface AttributedSegment extends DiarizedSegment { uid?: string; name: string; confidence: number }
export interface LabelResolution { label: string; uid?: string; name: string; confidence: number; segments: number }

export const PROXIMITY_MARGIN_DB = 3;     // the nearest phone must be this much louder than the next
export const LABEL_MAJORITY = 0.6;        // a label is named when an owner wins this share of its decided segments
export const MIN_DECIDED_SEGMENTS = 2;    // and at least this many were decided
export const UNKNOWN = 'A participant';

/** Mean loudness of a device over a window; null when it heard nothing in it. */
export function meanDb(samples: MeterSample[], fromMs: number, toMs: number): number | null {
  let sum = 0, n = 0;
  for (const s of samples) if (s.t >= fromMs && s.t <= toMs && Number.isFinite(s.db)) { sum += s.db; n++; }
  return n ? sum / n : null;
}

/** Which phone heard this window loudest, by a clear margin. */
export function nearestDevice(devices: DeviceMeter[], fromMs: number, toMs: number, marginDb = PROXIMITY_MARGIN_DB): { uid: string; name: string; marginDb: number } | null {
  const scored = devices.map((d) => ({ d, db: meanDb(d.samples, fromMs, toMs) })).filter((x): x is { d: DeviceMeter; db: number } => x.db != null).sort((a, b) => b.db - a.db);
  if (!scored.length) return null;
  if (scored.length === 1) return null;                  // one phone proves nothing about proximity
  const margin = scored[0].db - scored[1].db;
  return margin >= marginDb ? { uid: scored[0].d.uid, name: scored[0].d.name, marginDb: margin } : null;
}

/**
 * Attribute every segment. `sessionStartMs` anchors the segments' second offsets to the meters' epoch times.
 * Pure; deterministic.
 */
export function attributeSegments(segments: DiarizedSegment[], devices: DeviceMeter[], sessionStartMs: number): { segments: AttributedSegment[]; labels: LabelResolution[] } {
  // 1. Per-segment proximity decision.
  const decided = segments.map((s) => { const hit = nearestDevice(devices, sessionStartMs + s.start * 1000, sessionStartMs + s.end * 1000); return { s, hit }; });
  // 2. Per-label consensus: who owns speaker "A"?
  const byLabel = new Map<string, Map<string, { name: string; n: number; margin: number }>>(); const totals = new Map<string, number>();
  for (const { s, hit } of decided) {
    totals.set(s.speaker, (totals.get(s.speaker) || 0) + 1);
    if (!hit) continue;
    const m = byLabel.get(s.speaker) || new Map(); const cur = m.get(hit.uid) || { name: hit.name, n: 0, margin: 0 };
    cur.n++; cur.margin += hit.marginDb; m.set(hit.uid, cur); byLabel.set(s.speaker, m);
  }
  const labels: LabelResolution[] = [];
  const resolved = new Map<string, LabelResolution>();
  const takenOwners = new Set<string>();
  // Strongest labels first so an owner is not handed to two labels.
  const order = Array.from(totals.keys()).sort((a, b) => (totals.get(b) || 0) - (totals.get(a) || 0));
  for (const label of order) {
    const votes = byLabel.get(label); const total = totals.get(label) || 0;
    let res: LabelResolution = { label, name: UNKNOWN, confidence: 0, segments: total };
    if (votes) {
      const decidedN = Array.from(votes.values()).reduce((a, v) => a + v.n, 0);
      const [bestUid, best] = Array.from(votes.entries()).filter(([uid]) => !takenOwners.has(uid)).sort((a, b) => b[1].n - a[1].n)[0] || [];
      if (bestUid && best && decidedN >= MIN_DECIDED_SEGMENTS && best.n / decidedN >= LABEL_MAJORITY) {
        // Share of the label's decided segments, tempered by how many there were and how clear the loudness margin was.
        const share = best.n / decidedN; const sampleFactor = Math.min(1, 0.6 + decidedN * 0.1); const marginFactor = Math.min(1, 0.7 + (best.margin / best.n) / 20);
        const confidence = Math.min(1, share * sampleFactor * marginFactor);
        res = { label, uid: bestUid, name: best.name, confidence: Math.round(confidence * 100) / 100, segments: total };
        takenOwners.add(bestUid);
      }
    }
    labels.push(res); resolved.set(label, res);
  }
  // 3. Apply: a decided segment keeps its own hit when it agrees with the label; otherwise the label's owner; otherwise unknown.
  const out: AttributedSegment[] = decided.map(({ s, hit }) => {
    const lab = resolved.get(s.speaker)!;
    if (lab.uid) return { ...s, uid: lab.uid, name: lab.name, confidence: lab.confidence };
    if (hit) return { ...s, uid: hit.uid, name: hit.name, confidence: Math.min(0.59, 0.3 + hit.marginDb / 20) };   // a lone proximity hit: weak, below the naming bar
    return { ...s, name: UNKNOWN, confidence: 0 };
  });
  return { segments: out, labels };
}

/** Transcript lines for the summariser: names only where the floor is met, otherwise "A participant". */
export function attributedTranscript(segments: AttributedSegment[], floor = LABEL_MAJORITY): string {
  const lines: string[] = []; let last = '';
  for (const s of segments) {
    const who = s.confidence >= floor ? s.name : UNKNOWN;
    if (who === last && lines.length) lines[lines.length - 1] += ` ${s.text.trim()}`;
    else { lines.push(`${who}: ${s.text.trim()}`); last = who; }
  }
  return lines.join('\n');
}
