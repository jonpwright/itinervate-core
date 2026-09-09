"use strict";
/**
 * Distance and travel time calculation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.estimateTravelTime = estimateTravelTime;
exports.getTravelInfo = getTravelInfo;
exports.checkTravelFeasibility = checkTravelFeasibility;
exports.formatDistance = formatDistance;
exports.formatTravelTime = formatTravelTime;
exports.getTimeDifferenceMinutes = getTimeDifferenceMinutes;
/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.latitude)) *
            Math.cos(toRad(point2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Estimate travel time based on distance
 * Uses different speeds for different distance ranges:
 * - 0-5 km: 20 km/h (city traffic, walking possible)
 * - 5-20 km: 30 km/h (urban traffic)
 * - 20+ km: 50 km/h (highway/motorway)
 */
function estimateTravelTime(distanceKm) {
    let speed;
    if (distanceKm <= 5) {
        speed = 20; // Heavy city traffic or walking
    }
    else if (distanceKm <= 20) {
        speed = 30; // Urban traffic
    }
    else {
        speed = 50; // Highway/motorway
    }
    const timeHours = distanceKm / speed;
    const timeMinutes = Math.ceil(timeHours * 60);
    return timeMinutes;
}
/**
 * Calculate travel information between two locations
 */
function getTravelInfo(from, to, bufferMinutes = 15) {
    const distanceKm = calculateDistance(from, to);
    const distanceMiles = distanceKm * 0.621371;
    const estimatedMinutes = estimateTravelTime(distanceKm) + bufferMinutes;
    return {
        distanceKm: Math.round(distanceKm * 10) / 10,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        estimatedMinutes,
        warning: undefined,
    };
}
/**
 * Check if there's enough time between two events
 */
function checkTravelFeasibility(from, to, availableMinutes, bufferMinutes = 15) {
    const travelInfo = getTravelInfo(from, to, bufferMinutes);
    const feasible = availableMinutes >= travelInfo.estimatedMinutes;
    const result = {
        feasible,
        travelInfo,
    };
    if (!feasible) {
        result.shortfallMinutes = travelInfo.estimatedMinutes - availableMinutes;
        result.travelInfo.warning = `Insufficient time: need ${travelInfo.estimatedMinutes} min, have ${availableMinutes} min`;
    }
    return result;
}
/**
 * Format distance for display
 */
function formatDistance(km, miles, preferMetric = true) {
    if (preferMetric) {
        return `${km.toFixed(1)} km`;
    }
    else {
        return `${miles.toFixed(1)} mi`;
    }
}
/**
 * Format travel time for display
 */
function formatTravelTime(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
}
/**
 * Get time difference in minutes between two time strings (HH:MM format)
 */
function getTimeDifferenceMinutes(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return Math.abs(minutes2 - minutes1);
}
