export declare function detectLanguage(text: string): string | null;
/** Map a base language to the BCP-47 tag speech engines expect (regional default). */
export declare function speechLocaleFor(lang: string, preferRegion?: string | null): string;
