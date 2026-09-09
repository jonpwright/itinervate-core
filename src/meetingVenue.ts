/**
 * Human-friendly venue for a meeting. Prefers the stored venue name (from the
 * Places pick); otherwise, if the address is one of the trip's hotels, uses the
 * hotel name — "Conrad Singapore Orchard" is what you tell a driver, not
 * "1 Cuscaden Rd". Shared by web and mobile.
 */
export interface VenueMeeting { location?: string; venueName?: string }
export interface VenueHotel { name?: string; address?: string }

const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function meetingVenue(m: VenueMeeting, accommodations: VenueHotel[] = []): { venue?: string; address?: string } {
  const address = (m.location || '').trim();
  if (m.venueName && norm(m.venueName) !== norm(address)) return { venue: m.venueName, address: address || undefined };
  if (!address) return {};
  const a = norm(address);
  const hotel = accommodations.find((h) => {
    const ha = norm(h.address);
    if (!ha || ha.length < 8) return false;
    const street = norm((h.address || '').split(',')[0]);
    return a.includes(ha) || ha.includes(a) || (street.length >= 6 && a.includes(street));
  });
  if (hotel?.name) return { venue: hotel.name, address };
  return { address };
}

/** One-line label: "Conrad Singapore Orchard · 1 Cuscaden Rd, Singapore" (or just the address). */
export function meetingPlaceLabel(m: VenueMeeting, accommodations: VenueHotel[] = []): string {
  const { venue, address } = meetingVenue(m, accommodations);
  return [venue, address].filter(Boolean).join(' · ');
}
