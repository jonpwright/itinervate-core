"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechText = speechText;
const DEFAULT_WORDS = { rows: 'rows', andMore: 'and more in the message' };
function speechText(markdown, opts = {}) {
    const words = { ...DEFAULT_WORDS, ...(opts.words || {}) };
    const max = opts.maxChars ?? 1200;
    let s = (markdown || '').replace(/\r/g, '');
    s = s.replace(/```[\s\S]*?```/g, ' '); // code blocks
    s = s.replace(/`([^`]+)`/g, '$1'); // inline code
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' '); // images
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // links → text
    s = s.replace(/https?:\/\/\S+/g, ' '); // bare URLs
    s = s.replace(/^\s{0,3}#{1,6}\s*(.+)$/gm, '$1.'); // headings → sentence
    s = s.replace(/(\*\*|__)(.+?)\1/g, '$2').replace(/(\*|_)(?=\S)(.+?)(?<=\S)\1/g, '$2'); // bold / italic
    // Tables: summarise instead of reading cells.
    s = s.replace(/((?:^\|.*\|\s*$\n?){2,})/gm, (block) => {
        const rows = block.trim().split('\n').filter((r) => !/^\|\s*:?-{2,}/.test(r));
        const [header, ...body] = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        if (!body.length)
            return ' ';
        const firsts = body.slice(0, 3).map((r) => r[0]).filter(Boolean);
        const label = header?.[0] ? `${header[0]}: ` : '';
        return ` ${body.length} ${words.rows}. ${label}${firsts.join(', ')}${body.length > 3 ? `, ${words.andMore}` : ''}. `;
    });
    s = s.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm, ''); // list markers
    s = s.replace(/^\s*>\s?/gm, ''); // blockquotes
    s = s.replace(/^\s*[-*_]{3,}\s*$/gm, ' '); // rules
    s = s.replace(/[|#*_~]/g, ' '); // leftovers
    // Things voices misread.
    s = s.replace(/\b(\d{1,2}):(\d{2})\b/g, '$1:$2') // keep times
        .replace(/\b(\d+)\s*[-–]\s*(\d+)\b/g, '$1 to $2') // ranges
        .replace(/\s*→\s*/g, ' to ').replace(/\s*&\s*/g, ' and ')
        .replace(/\bETA\b/g, 'E T A').replace(/\bROI\b/g, 'R O I').replace(/\bPNR\b/g, 'booking reference')
        .replace(/\bT(\d)\b/g, 'terminal $1');
    // Sentence-end each line so the voice pauses between items.
    s = s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => (/[.!?:]$/.test(l) ? l : l + '.')).join(' ');
    s = s.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?;:])/g, '$1').replace(/\.{2,}/g, '.').trim();
    if (s.length > max) {
        const cut = s.slice(0, max);
        const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
        s = (end > max * 0.5 ? cut.slice(0, end + 1) : cut) + ` ${words.andMore}.`;
    }
    return s;
}
