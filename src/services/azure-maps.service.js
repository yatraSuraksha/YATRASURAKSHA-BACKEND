/**
 * Azure Maps Service
 * Provides map functionality using Azure Maps API
 */

const AZURE_MAPS_KEY = process.env.AZURE_MAPS_SUBSCRIPTION_KEY;
const AZURE_MAPS_CLIENT_ID = process.env.AZURE_MAPS_CLIENT_ID;
const AZURE_MAPS_BASE_URL = 'https://atlas.microsoft.com';

/**
 * Get Azure Maps configuration for client-side usage
 */
export const getAzureMapsConfig = () => {
    return {
        subscriptionKey: AZURE_MAPS_KEY,
        clientId: AZURE_MAPS_CLIENT_ID,
        language: 'en-US',
        view: 'Auto'
    };
};

/**
 * Geocode an address to coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} - Geocoded location data
 */
export const geocodeAddress = async (address) => {
    try {
        const url = `${AZURE_MAPS_BASE_URL}/search/address/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${encodeURIComponent(address)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                success: true,
                data: {
                    latitude: result.position.lat,
                    longitude: result.position.lon,
                    formattedAddress: result.address.freeformAddress,
                    address: result.address,
                    confidence: result.score
                }
            };
        }
        
        return { success: false, error: 'No results found' };
    } catch (error) {
        console.error('Geocoding error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - Address data
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const url = `${AZURE_MAPS_BASE_URL}/search/address/reverse/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${latitude},${longitude}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.addresses && data.addresses.length > 0) {
            const result = data.addresses[0];
            return {
                success: true,
                data: {
                    formattedAddress: result.address.freeformAddress,
                    streetName: result.address.streetName,
                    municipality: result.address.municipality,
                    country: result.address.country,
                    postalCode: result.address.postalCode,
                    address: result.address
                }
            };
        }
        
        return { success: false, error: 'No address found' };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search for Points of Interest (POI)
 * @param {string} query - Search query
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radius - Search radius in meters
 * @returns {Promise<Object>} - POI results
 */
export const searchPOI = async (query, latitude, longitude, radius = 5000) => {
    try {
        const url = `${AZURE_MAPS_BASE_URL}/search/poi/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${encodeURIComponent(query)}&lat=${latitude}&lon=${longitude}&radius=${radius}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results) {
            return {
                success: true,
                data: data.results.map(poi => ({
                    id: poi.id,
                    name: poi.poi?.name || 'Unknown',
                    category: poi.poi?.categories?.[0] || 'Other',
                    latitude: poi.position.lat,
                    longitude: poi.position.lon,
                    address: poi.address?.freeformAddress,
                    phone: poi.poi?.phone,
                    distance: poi.dist
                }))
            };
        }
        
        return { success: false, error: 'No POI found' };
    } catch (error) {
        console.error('POI search error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search for emergency services nearby
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {string} type - Type: 'hospital', 'police', 'fire'
 * @returns {Promise<Object>} - Emergency services results
 */
export const searchEmergencyServices = async (latitude, longitude, type = 'hospital') => {
    const categoryMap = {
        hospital: 'HOSPITAL',
        police: 'POLICE_STATION',
        fire: 'FIRE_STATION_BRIGADE'
    };
    
    const category = categoryMap[type] || 'HOSPITAL';
    
    try {
        const url = `${AZURE_MAPS_BASE_URL}/search/poi/category/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&categorySet=${category}&lat=${latitude}&lon=${longitude}&radius=10000&limit=10`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results) {
            return {
                success: true,
                data: data.results.map(service => ({
                    id: service.id,
                    name: service.poi?.name || 'Unknown',
                    type: type,
                    latitude: service.position.lat,
                    longitude: service.position.lon,
                    address: service.address?.freeformAddress,
                    phone: service.poi?.phone,
                    distance: service.dist
                }))
            };
        }
        
        return { success: false, error: 'No emergency services found' };
    } catch (error) {
        console.error('Emergency services search error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get route between two points
 * @param {Object} origin - Origin {latitude, longitude}
 * @param {Object} destination - Destination {latitude, longitude}
 * @param {string} travelMode - Mode: 'car', 'pedestrian', 'bicycle'
 * @returns {Promise<Object>} - Route data
 */
export const getRoute = async (origin, destination, travelMode = 'car') => {
    try {
        const url = `${AZURE_MAPS_BASE_URL}/route/directions/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}&travelMode=${travelMode}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                success: true,
                data: {
                    distanceInMeters: route.summary.lengthInMeters,
                    durationInSeconds: route.summary.travelTimeInSeconds,
                    distanceText: `${(route.summary.lengthInMeters / 1000).toFixed(2)} km`,
                    durationText: formatDuration(route.summary.travelTimeInSeconds),
                    legs: route.legs,
                    guidance: route.guidance
                }
            };
        }
        
        return { success: false, error: 'No route found' };
    } catch (error) {
        console.error('Route error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate distance between two points
 * @param {number} lat1 - Origin latitude
 * @param {number} lon1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {Object} - Distance data
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return {
        distanceInMeters: Math.round(distance),
        distanceInKm: (distance / 1000).toFixed(2),
        distanceText: distance > 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} m`
    };
};

/**
 * Check if a point is within a geofence
 * @param {number} latitude - Point latitude
 * @param {number} longitude - Point longitude
 * @param {Object} geofence - Geofence {centerLat, centerLon, radiusMeters}
 * @returns {Object} - Geofence check result
 */
export const checkGeofence = (latitude, longitude, geofence) => {
    const distance = calculateDistance(
        latitude, longitude,
        geofence.centerLat, geofence.centerLon
    );
    
    const isInside = distance.distanceInMeters <= geofence.radiusMeters;
    
    return {
        isInside,
        distanceFromCenter: distance.distanceInMeters,
        distanceFromBoundary: isInside 
            ? geofence.radiusMeters - distance.distanceInMeters 
            : distance.distanceInMeters - geofence.radiusMeters
    };
};

/**
 * Get timezone for a location
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - Timezone data
 */
export const getTimezone = async (latitude, longitude) => {
    try {
        const timestamp = new Date().toISOString();
        const url = `${AZURE_MAPS_BASE_URL}/timezone/byCoordinates/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${latitude},${longitude}&timestamp=${timestamp}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.TimeZones && data.TimeZones.length > 0) {
            const tz = data.TimeZones[0];
            return {
                success: true,
                data: {
                    timeZoneId: tz.Id,
                    displayName: tz.Names?.Standard,
                    utcOffset: tz.ReferenceTime?.StandardOffset,
                    currentTime: tz.ReferenceTime?.WallTime
                }
            };
        }
        
        return { success: false, error: 'Timezone not found' };
    } catch (error) {
        console.error('Timezone error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get weather for a location
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - Weather data
 */
export const getWeather = async (latitude, longitude) => {
    try {
        const url = `${AZURE_MAPS_BASE_URL}/weather/currentConditions/json?api-version=1.1&subscription-key=${AZURE_MAPS_KEY}&query=${latitude},${longitude}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const weather = data.results[0];
            return {
                success: true,
                data: {
                    description: weather.phrase,
                    temperature: weather.temperature?.value,
                    temperatureUnit: weather.temperature?.unit,
                    humidity: weather.relativeHumidity,
                    windSpeed: weather.wind?.speed?.value,
                    windDirection: weather.wind?.direction?.localizedDescription,
                    uvIndex: weather.uvIndex,
                    visibility: weather.visibility?.value
                }
            };
        }
        
        return { success: false, error: 'Weather data not found' };
    } catch (error) {
        console.error('Weather error:', error);
        return { success: false, error: error.message };
    }
};

// Helper functions
function toRad(deg) {
    return deg * (Math.PI / 180);
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
}

export default {
    getAzureMapsConfig,
    geocodeAddress,
    reverseGeocode,
    searchPOI,
    searchEmergencyServices,
    getRoute,
    calculateDistance,
    checkGeofence,
    getTimezone,
    getWeather
};
