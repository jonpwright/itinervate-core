/**
 * Faceted filtering + sorting for Business Contacts (surname, country, city,
 * firm). Pure functions so the same logic runs on web and mobile.
 */
export interface FilterableContact {
    name?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    city?: string;
    country?: string;
    address?: string;
    email?: string;
    title?: string;
    createdAt?: string;
}
export interface ContactFacets {
    surname: string[];
    country: string[];
    city: string[];
    firm: string[];
}
export type ContactSort = 'surname' | 'firm' | 'recent';
export declare const EMPTY_FACETS: ContactFacets;
/** Family name: explicit lastName, else the last token of the cleaned full name. */
export declare function surnameOf(c: FilterableContact): string;
export declare function surnameInitial(c: FilterableContact): string;
/**
 * Country/city: prefer structured fields; fall back to a light parse of the
 * free-text address (last comma segment ≈ country, the one before ≈ city).
 */
export declare function locationOf(c: FilterableContact): {
    city: string;
    country: string;
};
export declare function firmOf(c: FilterableContact): string;
/** Distinct, sorted facet options present in the given contacts. */
export declare function buildContactFacets(contacts: FilterableContact[]): ContactFacets;
export interface ContactFilterState {
    query: string;
    surname: string[];
    country: string[];
    city: string[];
    firm: string[];
    sort: ContactSort;
}
export declare const EMPTY_FILTERS: ContactFilterState;
export declare function hasActiveFacets(f: ContactFilterState): boolean;
/** Apply free-text search + facets, then sort. */
export declare function applyContactFilters<T extends FilterableContact>(contacts: T[], f: ContactFilterState): T[];
