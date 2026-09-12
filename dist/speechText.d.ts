/**
 * Turn an assistant reply (markdown) into text that reads well aloud.
 *
 * Avi answers in structured markdown — headings, bullets, bold, tables, links.
 * Read literally that is unbearable ("asterisk asterisk Flight asterisk
 * asterisk, pipe, pipe…"), so: strip formatting, turn list items into short
 * sentences, summarise tables as "N rows: first, second, third…", drop URLs
 * but keep link text, and expand a few travel abbreviations the voices misread.
 */
export interface SpeechTextOptions {
    /** Max characters to speak (long answers get a spoken "…and more" tail). Default 1200. */
    maxChars?: number;
    /** Words for the table summary and truncation tail, so callers can localise. */
    words?: {
        rows: string;
        andMore: string;
    };
}
export declare function speechText(markdown: string, opts?: SpeechTextOptions): string;
