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
export interface DiarizedSegment {
    speaker: string;
    start: number;
    end: number;
    text: string;
}
export interface MeterSample {
    t: number;
    db: number;
}
export interface DeviceMeter {
    uid: string;
    name: string;
    samples: MeterSample[];
}
export interface AttributedSegment extends DiarizedSegment {
    uid?: string;
    name: string;
    confidence: number;
}
export interface LabelResolution {
    label: string;
    uid?: string;
    name: string;
    confidence: number;
    segments: number;
}
export declare const PROXIMITY_MARGIN_DB = 3;
export declare const LABEL_MAJORITY = 0.6;
export declare const MIN_DECIDED_SEGMENTS = 2;
export declare const UNKNOWN = "A participant";
/** Mean loudness of a device over a window; null when it heard nothing in it. */
export declare function meanDb(samples: MeterSample[], fromMs: number, toMs: number): number | null;
/** Which phone heard this window loudest, by a clear margin. */
export declare function nearestDevice(devices: DeviceMeter[], fromMs: number, toMs: number, marginDb?: number): {
    uid: string;
    name: string;
    marginDb: number;
} | null;
/**
 * Attribute every segment. `sessionStartMs` anchors the segments' second offsets to the meters' epoch times.
 * Pure; deterministic.
 */
export declare function attributeSegments(segments: DiarizedSegment[], devices: DeviceMeter[], sessionStartMs: number): {
    segments: AttributedSegment[];
    labels: LabelResolution[];
};
/** Transcript lines for the summariser: names only where the floor is met, otherwise "A participant". */
export declare function attributedTranscript(segments: AttributedSegment[], floor?: number): string;
