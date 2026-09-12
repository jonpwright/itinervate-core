/**
 * Airline logo helpers.
 *
 * Prefers a logo captured at booking time (Duffel's carrier logo_symbol_url,
 * stored on the flight as `airlineLogo`). Falls back to a keyless IATA-derived
 * logo CDN so manually-added flights — and any pre-existing flights — still show
 * a mark at render time without a data migration.
 */

/** Keyless airline-logo CDN (Kiwi.com), by 2-letter IATA code. */
export function airlineLogoFromIata(iata?: string | null): string | null {
  if (!iata) return null;
  const code = String(iata).trim().toUpperCase();
  if (!/^[A-Z0-9]{2,3}$/.test(code)) return null;
  return `https://images.kiwi.com/airlines/64/${code}.png`;
}

/** Best-effort IATA code from stored flight fields (explicit field or flightNumber prefix). */
export function flightAirlineIata(flight: any): string | null {
  const explicit = flight?.airlineIata || flight?.airline_iata;
  if (explicit && /^[A-Za-z0-9]{2,3}$/.test(String(explicit))) return String(explicit).toUpperCase();
  const fn = String(flight?.flightNumber || '').trim().toUpperCase();
  // IATA airline designators are two characters (a letter plus a letter or
  // digit, e.g. QF, 3K, U2). A greedy 2–3 match took "JL5" from "JL52" and
  // asked the CDN for a carrier that doesn't exist; ICAO three-letter codes
  // are not used in flight numbers.
  const m = fn.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])\s*\d/); // QF123, BA 456, 3K123, U2 456
  return m ? m[1] : null;
}

/** Resolve the best logo URL for a flight: stored Duffel logo, else IATA fallback. */
export function flightLogoUrl(flight: any): string | null {
  if (flight?.airlineLogo && typeof flight.airlineLogo === 'string') return flight.airlineLogo;
  return airlineLogoFromIata(flightAirlineIata(flight));
}
