/**
 * Human-friendly venue for a meeting. Prefers the stored venue name (from the
 * Places pick); otherwise, if the address is one of the trip's hotels, uses the
 * hotel name — "Conrad Singapore Orchard" is what you tell a driver, not
 * "1 Cuscaden Rd". Shared by web and mobile.
 */
export interface VenueMeeting {
    location?: string;
    venueName?: string;
}
export interface VenueHotel {
    name?: string;
    address?: string;
}
export declare function meetingVenue(m: VenueMeeting, accommodations?: VenueHotel[]): {
    venue?: string;
    address?: string;
};
/** One-line label: "Conrad Singapore Orchard · 1 Cuscaden Rd, Singapore" (or just the address). */
export declare function meetingPlaceLabel(m: VenueMeeting, accommodations?: VenueHotel[]): string;
