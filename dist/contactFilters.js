"use strict";
/**
 * Faceted filtering + sorting for Business Contacts (surname, country, city,
 * firm). Pure functions so the same logic runs on web and mobile.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_FILTERS = exports.EMPTY_FACETS = void 0;
exports.surnameOf = surnameOf;
exports.surnameInitial = surnameInitial;
exports.locationOf = locationOf;
exports.firmOf = firmOf;
exports.buildContactFacets = buildContactFacets;
exports.hasActiveFacets = hasActiveFacets;
exports.applyContactFilters = applyContactFilters;
exports.EMPTY_FACETS = { surname: [], country: [], city: [], firm: [] };
const HONORIFICS = /^(dr|mr|mrs|ms|miss|prof|sir|dame)\.?\s+/i;
const SUFFIXES = /\s*,?\s*\b(ph\.?d\.?|phd|jr\.?|sr\.?|ii|iii|iv|esq\.?|md|dds|dvm|llb|llm|qc|kc)\b\.?$/i;
/** Family name: explicit lastName, else the last token of the cleaned full name. */
function surnameOf(c) {
    if (c.lastName && c.lastName.trim())
        return c.lastName.trim();
    let n = (c.name || '').trim().replace(HONORIFICS, '');
    for (let i = 0; i < 3; i++)
        n = n.replace(SUFFIXES, '').trim(); // strip stacked suffixes
    const parts = n.split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}
function surnameInitial(c) {
    const s = surnameOf(c);
    return s ? s[0].toUpperCase() : '';
}
/**
 * Country/city: prefer structured fields; fall back to a light parse of the
 * free-text address (last comma segment ≈ country, the one before ≈ city).
 */
function locationOf(c) {
    let city = (c.city || '').trim();
    let country = (c.country || '').trim();
    if ((!city || !country) && c.address) {
        const segs = c.address.split(',').map((s) => s.trim()).filter(Boolean);
        if (!country && segs.length) {
            country = segs[segs.length - 1].replace(/\b\d{3,}[-\d]*\b/g, '').trim();
            // "Osaka 541-0045 Japan" → "Japan"
            const words = country.split(/\s+/);
            if (words.length > 2)
                country = words.slice(-1)[0];
        }
        if (!city && segs.length >= 2) {
            city = segs[segs.length - 2].replace(/\b\d{3,}[-\d]*\b/g, '').replace(/\b[A-Z]{2,3}\b$/, '').trim();
        }
    }
    return { city, country };
}
function firmOf(c) {
    return (c.company || '').trim();
}
/** Distinct, sorted facet options present in the given contacts. */
function buildContactFacets(contacts) {
    const surname = new Set(), country = new Set(), city = new Set(), firm = new Set();
    for (const c of contacts) {
        const ini = surnameInitial(c);
        if (ini)
            surname.add(ini);
        const loc = locationOf(c);
        if (loc.country)
            country.add(loc.country);
        if (loc.city)
            city.add(loc.city);
        const f = firmOf(c);
        if (f)
            firm.add(f);
    }
    const sortAlpha = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
    return {
        surname: Array.from(surname).sort(sortAlpha),
        country: Array.from(country).sort(sortAlpha),
        city: Array.from(city).sort(sortAlpha),
        firm: Array.from(firm).sort(sortAlpha),
    };
}
exports.EMPTY_FILTERS = { query: '', surname: [], country: [], city: [], firm: [], sort: 'surname' };
function hasActiveFacets(f) {
    return f.surname.length + f.country.length + f.city.length + f.firm.length > 0;
}
/** Apply free-text search + facets, then sort. */
function applyContactFilters(contacts, f) {
    const q = f.query.trim().toLowerCase();
    const out = contacts.filter((c) => {
        if (q) {
            const hay = [c.name, c.firstName, c.lastName, c.company, c.email, c.title, c.city, c.country].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q))
                return false;
        }
        if (f.surname.length && !f.surname.includes(surnameInitial(c)))
            return false;
        const loc = locationOf(c);
        if (f.country.length && !f.country.includes(loc.country))
            return false;
        if (f.city.length && !f.city.includes(loc.city))
            return false;
        if (f.firm.length && !f.firm.includes(firmOf(c)))
            return false;
        return true;
    });
    const cmp = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
    if (f.sort === 'surname')
        out.sort((a, b) => cmp(surnameOf(a), surnameOf(b)) || cmp(a.name || '', b.name || ''));
    else if (f.sort === 'firm')
        out.sort((a, b) => cmp(firmOf(a), firmOf(b)) || cmp(surnameOf(a), surnameOf(b)));
    else
        out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return out;
}
