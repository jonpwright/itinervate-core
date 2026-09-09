/**
 * Airline logo helpers.
 *
 * Prefers a logo captured at booking time (Duffel's carrier logo_symbol_url,
 * stored on the flight as `airlineLogo`). Falls back to a keyless IATA-derived
 * logo CDN so manually-added flights — and any pre-existing flights — still show
 * a mark at render time without a data migration.
 */
/** Keyless airline-logo CDN (Kiwi.com), by 2-letter IATA code. */
export declare function airlineLogoFromIata(iata?: string | null): string | null;
/** Best-effort IATA code from stored flight fields (explicit field or flightNumber prefix). */
export declare function flightAirlineIata(flight: any): string | null;
/** Resolve the best logo URL for a flight: stored Duffel logo, else IATA fallback. */
export declare function flightLogoUrl(flight: any): string | null;
