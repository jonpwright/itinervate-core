/**
 * Cheap, offline language detection for short chat text — enough to pick a
 * speech voice or a recognition locale. Script-based for CJK/Cyrillic/Arabic/
 * Hebrew/Thai/Greek/Devanagari, stop-word scoring for Latin-script languages.
 * Returns a BCP-47 base tag ("ja", "fr", …) or null when unsure.
 */
const SCRIPTS: Array<[RegExp, string]> = [
  [/[\u3040-\u309f\u30a0-\u30ff]/, 'ja'],            // hiragana / katakana → Japanese (before Han)
  [/[\uac00-\ud7af]/, 'ko'],
  [/[\u0e00-\u0e7f]/, 'th'],
  [/[\u0600-\u06ff]/, 'ar'],
  [/[\u0590-\u05ff]/, 'he'],
  [/[\u0900-\u097f]/, 'hi'],
  [/[\u0370-\u03ff]/, 'el'],
  [/[\u0400-\u04ff]/, 'ru'],                          // Cyrillic (uk refined below)
  [/[\u4e00-\u9fff]/, 'zh'],
];
const STOP: Record<string, string[]> = {
  en: ['the', 'and', 'is', 'to', 'what', 'my', 'next', 'meeting', 'i', 'you', 'for', 'of', 'in', 'on', 'with', 'do', 'have', 'when', 'where', 'please'],
  fr: ['le', 'la', 'les', 'et', 'est', 'je', 'ma', 'mon', 'mes', 'prochaine', 'réunion', 'quel', 'quelle', 'pour', 'dans', 'avec', 'vous', 'nous', 'des', 'une', 'un'],
  es: ['el', 'la', 'los', 'las', 'y', 'es', 'mi', 'próxima', 'reunión', 'qué', 'cuál', 'para', 'con', 'en', 'una', 'un', 'por', 'tengo', 'dónde', 'cuándo'],
  de: ['der', 'die', 'das', 'und', 'ist', 'ich', 'mein', 'meine', 'nächste', 'nächstes', 'termin', 'meeting', 'was', 'wann', 'wo', 'für', 'mit', 'nicht', 'bitte', 'haben'],
  it: ['il', 'la', 'gli', 'le', 'e', 'è', 'mio', 'mia', 'prossima', 'prossimo', 'riunione', 'quale', 'cosa', 'per', 'con', 'una', 'un', 'dove', 'quando', 'ho'],
  pt: ['o', 'a', 'os', 'as', 'e', 'é', 'meu', 'minha', 'próxima', 'reunião', 'qual', 'que', 'para', 'com', 'uma', 'um', 'onde', 'quando', 'tenho', 'não'],
  nl: ['de', 'het', 'en', 'is', 'ik', 'mijn', 'volgende', 'vergadering', 'wat', 'wanneer', 'waar', 'voor', 'met', 'een', 'niet', 'heb', 'je', 'we', 'van', 'op'],
  sv: ['och', 'är', 'jag', 'min', 'mitt', 'nästa', 'möte', 'vad', 'när', 'var', 'för', 'med', 'en', 'ett', 'inte', 'har', 'du', 'vi', 'på', 'till'],
  da: ['og', 'er', 'jeg', 'min', 'mit', 'næste', 'møde', 'hvad', 'hvornår', 'hvor', 'for', 'med', 'en', 'et', 'ikke', 'har', 'du', 'vi', 'på', 'til'],
  nb: ['og', 'er', 'jeg', 'min', 'mitt', 'neste', 'møte', 'hva', 'når', 'hvor', 'for', 'med', 'en', 'et', 'ikke', 'har', 'du', 'vi', 'på', 'til'],
  fi: ['ja', 'on', 'minä', 'minun', 'seuraava', 'kokous', 'mitä', 'milloin', 'missä', 'kanssa', 'ei', 'olen', 'sinä', 'me', 'että', 'tämä', 'se', 'mikä', 'kuinka', 'voi'],
  pl: ['i', 'jest', 'ja', 'moje', 'mój', 'następne', 'spotkanie', 'co', 'kiedy', 'gdzie', 'dla', 'z', 'nie', 'mam', 'ty', 'my', 'na', 'do', 'się', 'jak'],
  cs: ['a', 'je', 'já', 'moje', 'můj', 'další', 'schůzka', 'co', 'kdy', 'kde', 'pro', 's', 'ne', 'mám', 'ty', 'my', 'na', 'do', 'se', 'jak'],
  tr: ['ve', 'bir', 'benim', 'sonraki', 'toplantı', 'ne', 'nerede', 'için', 'ile', 'değil', 'var', 'bu', 'mi', 'mı', 'ben', 'sen', 'biz', 'da', 'de', 'nasıl'],
  id: ['dan', 'adalah', 'saya', 'rapat', 'berikutnya', 'apa', 'kapan', 'di', 'mana', 'untuk', 'dengan', 'tidak', 'ada', 'ini', 'itu', 'yang', 'kami', 'anda', 'bagaimana', 'ke'],
  vi: ['và', 'là', 'tôi', 'của', 'cuộc', 'họp', 'tiếp', 'theo', 'gì', 'khi', 'nào', 'ở', 'đâu', 'cho', 'với', 'không', 'có', 'này', 'bạn', 'chúng'],
  ro: ['și', 'este', 'eu', 'mea', 'meu', 'următoarea', 'întâlnire', 'ce', 'când', 'unde', 'pentru', 'cu', 'nu', 'am', 'tu', 'noi', 'pe', 'la', 'în', 'cum'],
};
const UK_HINT = /[іїєґ]/i;

export function detectLanguage(text: string): string | null {
  const t = (text || '').trim(); if (t.length < 2) return null;
  for (const [re, lang] of SCRIPTS) if (re.test(t)) return lang === 'ru' && UK_HINT.test(t) ? 'uk' : lang;
  const words = t.toLowerCase().replace(/[^\p{L}\s'’-]/gu, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  let best: string | null = null, bestScore = 0, second = 0;
  for (const [lang, list] of Object.entries(STOP)) {
    const set = new Set(list); let score = 0;
    for (const w of words) if (set.has(w)) score++;
    // Diacritics typical of the language add confidence for short inputs.
    if (lang === 'fr' && /[éèêàçù]/.test(t)) score += 0.5; if (lang === 'es' && /[ñ¿¡]/.test(t)) score += 1; if (lang === 'de' && /[äöüß]/.test(t)) score += 1; if (lang === 'pt' && /[ãõç]/.test(t)) score += 1;
    if (lang === 'tr' && /[şğı]/.test(t)) score += 1; if (lang === 'pl' && /[łżźćńś]/.test(t)) score += 1; if (lang === 'cs' && /[řěůň]/.test(t)) score += 1; if (lang === 'vi' && /[ơưđạảấ]/.test(t)) score += 1; if (lang === 'ro' && /[șță]/.test(t)) score += 1;
    if (score > bestScore) { second = bestScore; bestScore = score; best = lang; } else if (score > second) second = score;
  }
  // Need a clear winner: at least one hit and not a tie.
  return bestScore >= 1 && bestScore > second ? best : null;
}

/** Map a base language to the BCP-47 tag speech engines expect (regional default). */
export function speechLocaleFor(lang: string, preferRegion?: string | null): string {
  const base = lang.toLowerCase().split('-')[0];
  if (preferRegion && preferRegion.toLowerCase().startsWith(base + '-')) return preferRegion;
  const DEFAULTS: Record<string, string> = { en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR', fr: 'fr-FR', es: 'es-ES', de: 'de-DE', it: 'it-IT', pt: 'pt-PT', nl: 'nl-NL', sv: 'sv-SE', da: 'da-DK', nb: 'nb-NO', fi: 'fi-FI', pl: 'pl-PL', cs: 'cs-CZ', tr: 'tr-TR', id: 'id-ID', vi: 'vi-VN', ro: 'ro-RO', ru: 'ru-RU', uk: 'uk-UA', ar: 'ar-SA', he: 'he-IL', hi: 'hi-IN', th: 'th-TH', el: 'el-GR' };
  return DEFAULTS[base] || `${base}-${base.toUpperCase()}`;
}
