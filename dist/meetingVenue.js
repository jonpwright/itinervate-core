"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingVenue = meetingVenue;
exports.meetingPlaceLabel = meetingPlaceLabel;
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function meetingVenue(m, accommodations = []) {
    const address = (m.location || '').trim();
    if (m.venueName && norm(m.venueName) !== norm(address))
        return { venue: m.venueName, address: address || undefined };
    if (!address)
        return {};
    const a = norm(address);
    const hotel = accommodations.find((h) => {
        const ha = norm(h.address);
        if (!ha || ha.length < 8)
            return false;
        const street = norm((h.address || '').split(',')[0]);
        return a.includes(ha) || ha.includes(a) || (street.length >= 6 && a.includes(street));
    });
    if (hotel?.name)
        return { venue: hotel.name, address };
    return { address };
}
/** One-line label: "Conrad Singapore Orchard · 1 Cuscaden Rd, Singapore" (or just the address). */
function meetingPlaceLabel(m, accommodations = []) {
    const { venue, address } = meetingVenue(m, accommodations);
    return [venue, address].filter(Boolean).join(' · ');
}
