"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.airlineCheckInUrl = airlineCheckInUrl;
exports.hasAirlineCheckIn = hasAirlineCheckIn;
const q = (v) => encodeURIComponent((v || '').trim());
const CHECK_IN = {
    QF: (r, s) => `https://www.qantas.com/au/en/manage-booking.html${r && s ? `?bookingReference=${q(r)}&lastName=${q(s)}` : ''}`,
    VA: () => 'https://www.virginaustralia.com/au/en/manage-booking/',
    JQ: () => 'https://www.jetstar.com/au/en/manage-booking',
    SQ: () => 'https://www.singaporeair.com/en_UK/us/plan-travel/check-in/',
    CX: () => 'https://www.cathaypacific.com/cx/en_HK/manage-booking/check-in.html',
    NH: () => 'https://www.ana.co.jp/en/us/plan-book/check-in/',
    JL: () => 'https://www.jal.co.jp/intl/en/checkin/',
    BA: (r, s) => `https://www.britishairways.com/travel/managebooking/public/en_gb${r && s ? `?bookingRef=${q(r)}&lastname=${q(s)}` : ''}`,
    EK: (r, s) => `https://www.emirates.com/english/manage-booking/online-check-in.aspx${r && s ? `?bookingRef=${q(r)}&lastName=${q(s)}` : ''}`,
    QR: () => 'https://www.qatarairways.com/en/check-in.html',
    EY: () => 'https://www.etihad.com/en/manage/check-in',
    LH: () => 'https://www.lufthansa.com/us/en/online-check-in',
    AF: () => 'https://wwws.airfrance.us/check-in',
    KL: () => 'https://www.klm.com/check-in',
    UA: () => 'https://www.united.com/en/us/checkin',
    AA: (r, s) => `https://www.aa.com/reservation/view/find-your-trip${r && s ? `?pnr=${q(r)}&lastName=${q(s)}` : ''}`,
    DL: () => 'https://www.delta.com/mytrips/',
    AC: () => 'https://www.aircanada.com/us/en/aco/home/plan/check-in.html',
    NZ: () => 'https://www.airnewzealand.com/manage-booking',
    TG: () => 'https://www.thaiairways.com/en/manage/check-in.page',
    MH: () => 'https://www.malaysiaairlines.com/hq/en/manage-booking/check-in.html',
    GA: () => 'https://www.garuda-indonesia.com/other-countries/en/manage-your-trip/online-check-in',
    KE: () => 'https://www.koreanair.com/check-in',
    OZ: () => 'https://flyasiana.com/C/US/EN/check-in',
    CI: () => 'https://www.china-airlines.com/us/en/booking/manage-my-trip',
    BR: () => 'https://www.evaair.com/en-global/manage-your-trip/check-in/',
    TK: () => 'https://www.turkishairlines.com/en-int/flights/manage-booking/',
    IB: () => 'https://www.iberia.com/us/online-checkin/',
    LX: () => 'https://www.swiss.com/us/en/prepare/online-check-in',
    OS: () => 'https://www.austrian.com/us/en/online-check-in',
    SK: () => 'https://www.flysas.com/en/check-in/',
    AY: () => 'https://www.finnair.com/en/check-in',
    FJ: () => 'https://www.fijiairways.com/en-au/manage/check-in/',
    PR: () => 'https://www.philippineairlines.com/en/manage-booking',
    VN: () => 'https://www.vietnamairlines.com/vn/en/plan-book/check-in',
    AI: () => 'https://www.airindia.com/in/en/manage/web-check-in.html',
    '6E': () => 'https://www.goindigo.in/web-check-in.html',
    U2: () => 'https://www.easyjet.com/en/manage-bookings',
    FR: () => 'https://www.ryanair.com/gb/en/check-in',
    WN: () => 'https://www.southwest.com/air/check-in/',
    B6: () => 'https://www.jetblue.com/check-in',
    AS: () => 'https://www.alaskaair.com/checkin',
    LA: () => 'https://www.latamairlines.com/us/en/my-trips',
    ET: () => 'https://www.ethiopianairlines.com/aa/book/manage-booking',
    SA: () => 'https://www.flysaa.com/manage-fly/check-in',
};
function airlineCheckInUrl(iata, airlineName, bookingReference, surname) {
    const code = (iata || '').trim().toUpperCase();
    const b = code ? CHECK_IN[code] : undefined;
    if (b)
        return b(bookingReference || undefined, surname || undefined);
    const name = (airlineName || code || 'airline').trim();
    return `https://www.google.com/search?q=${encodeURIComponent(`${name} online check-in`)}`;
}
/** True when we have a real carrier page (not the search fallback). */
function hasAirlineCheckIn(iata) {
    return !!(iata && CHECK_IN[iata.trim().toUpperCase()]);
}
