/**
 * Distance and travel time calculation utilities
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface Location {
    address: string;
    coordinates?: Coordinates;
}
export interface TravelInfo {
    distanceKm: number;
    distanceMiles: number;
    estimatedMinutes: number;
    warning?: string;
}
/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export declare function calculateDistance(point1: Coordinates, point2: Coordinates): number;
/**
 * Estimate travel time based on distance
 * Uses different speeds for different distance ranges:
 * - 0-5 km: 20 km/h (city traffic, walking possible)
 * - 5-20 km: 30 km/h (urban traffic)
 * - 20+ km: 50 km/h (highway/motorway)
 */
export declare function estimateTravelTime(distanceKm: number): number;
/**
 * Calculate travel information between two locations
 */
export declare function getTravelInfo(from: Coordinates, to: Coordinates, bufferMinutes?: number): TravelInfo;
/**
 * Check if there's enough time between two events
 */
export declare function checkTravelFeasibility(from: Coordinates, to: Coordinates, availableMinutes: number, bufferMinutes?: number): {
    feasible: boolean;
    travelInfo: TravelInfo;
    shortfallMinutes?: number;
};
/**
 * Format distance for display
 */
export declare function formatDistance(km: number, miles: number, preferMetric?: boolean): string;
/**
 * Format travel time for display
 */
export declare function formatTravelTime(minutes: number): string;
/**
 * Get time difference in minutes between two time strings (HH:MM format)
 */
export declare function getTimeDifferenceMinutes(time1: string, time2: string): number;
