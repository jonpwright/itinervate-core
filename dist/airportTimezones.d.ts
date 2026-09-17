/**
 * IATA airport code -> IANA timezone.
 *
 * GENERATED FILE — do not edit by hand.
 * Regenerate with:
 *   npx tsx --env-file=.env.local scripts/generate-airport-timezones.ts
 *
 * ## Why this exists
 *
 * Flight times are stored as the AIRPORT-LOCAL wall clock: Duffel reports
 * `departing_at` without an offset, and manual entry copies the boarding pass.
 * So scheduling a reminder needs the airport's own zone. The reminder cron
 * sweeps every upcoming flight for every user, so a network lookup per flight
 * is not viable, and lib/timezoneFromLocation.ts needs coordinates we do not
 * store on flights anyway.
 *
 * Zones, not offsets: "America/New_York" tracks DST automatically, which a
 * stored "-05:00" cannot. A fixed offset was half of the original reminder bug.
 *
 * Source: Duffel Airports API, which publishes `time_zone` from the tz
 * database. Only airports with a 3-letter IATA code and a zone this runtime
 * accepts are included, since those are the ones that can appear on a booking.
 *
 * 9040 airports across 399 distinct zones.
 */
/**
 * IANA zone for an IATA airport code, or undefined if not found.
 *
 * Callers must handle undefined explicitly — inventing a zone is what produced
 * reminders 18 hours out for US departures.
 */
export declare function airportTimeZone(iata: unknown): string | undefined;
/** Number of airports covered — asserted in tests to catch accidental truncation. */
export declare const AIRPORT_TIME_ZONE_COUNT: number;
