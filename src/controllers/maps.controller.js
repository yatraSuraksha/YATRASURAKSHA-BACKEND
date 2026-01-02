/**
 * Maps Controller
 * Handles all map-related API requests
 */

import * as azureMapsService from '../services/azure-maps.service.js';

/**
 * @swagger
 * /api/maps/config:
 *   get:
 *     summary: Get Azure Maps configuration
 *     tags: [🗺️ Maps]
 *     description: Returns Azure Maps configuration for client-side map initialization
 *     responses:
 *       200:
 *         description: Maps configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 provider:
 *                   type: string
 *                 config:
 *                   type: object
 */
export const getMapsConfig = async (req, res) => {
    try {
        const config = azureMapsService.getAzureMapsConfig();
        res.json({
            success: true,
            provider: 'azure',
            config
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/geocode:
 *   get:
 *     summary: Geocode an address
 *     tags: [🗺️ Maps]
 *     description: Convert an address to coordinates
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Address to geocode
 *     responses:
 *       200:
 *         description: Geocoded location
 *       400:
 *         description: Address is required
 */
export const geocode = async (req, res) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({ success: false, error: 'Address is required' });
        }
        
        const result = await azureMapsService.geocodeAddress(address);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates
 *     tags: [🗺️ Maps]
 *     description: Convert coordinates to an address
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Address result
 *       400:
 *         description: Coordinates are required
 */
export const reverseGeocode = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }
        
        const result = await azureMapsService.reverseGeocode(parseFloat(latitude), parseFloat(longitude));
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/search/poi:
 *   get:
 *     summary: Search Points of Interest
 *     tags: [🗺️ Maps]
 *     description: Search for nearby points of interest
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *         description: Search radius in meters
 *     responses:
 *       200:
 *         description: POI results
 */
export const searchPOI = async (req, res) => {
    try {
        const { query, latitude, longitude, radius } = req.query;
        
        if (!query || !latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Query, latitude, and longitude are required' });
        }
        
        const result = await azureMapsService.searchPOI(
            query, 
            parseFloat(latitude), 
            parseFloat(longitude), 
            parseInt(radius) || 5000
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/search/emergency:
 *   get:
 *     summary: Search emergency services
 *     tags: [🗺️ Maps]
 *     description: Find nearby hospitals, police stations, or fire stations
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [hospital, police, fire]
 *           default: hospital
 *     responses:
 *       200:
 *         description: Emergency services results
 */
export const searchEmergency = async (req, res) => {
    try {
        const { latitude, longitude, type } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }
        
        const result = await azureMapsService.searchEmergencyServices(
            parseFloat(latitude), 
            parseFloat(longitude), 
            type || 'hospital'
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/route:
 *   get:
 *     summary: Get route between two points
 *     tags: [🗺️ Maps]
 *     description: Calculate route with distance and duration
 *     parameters:
 *       - in: query
 *         name: originLat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: originLon
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: destLat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: destLon
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [car, pedestrian, bicycle]
 *           default: car
 *     responses:
 *       200:
 *         description: Route information
 */
export const getRoute = async (req, res) => {
    try {
        const { originLat, originLon, destLat, destLon, mode } = req.query;
        
        if (!originLat || !originLon || !destLat || !destLon) {
            return res.status(400).json({ success: false, error: 'Origin and destination coordinates are required' });
        }
        
        const result = await azureMapsService.getRoute(
            { latitude: parseFloat(originLat), longitude: parseFloat(originLon) },
            { latitude: parseFloat(destLat), longitude: parseFloat(destLon) },
            mode || 'car'
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/distance:
 *   get:
 *     summary: Calculate distance between two points
 *     tags: [🗺️ Maps]
 *     description: Calculate straight-line distance
 *     parameters:
 *       - in: query
 *         name: lat1
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lon1
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lat2
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lon2
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Distance result
 */
export const getDistance = async (req, res) => {
    try {
        const { lat1, lon1, lat2, lon2 } = req.query;
        
        if (!lat1 || !lon1 || !lat2 || !lon2) {
            return res.status(400).json({ success: false, error: 'All coordinates are required' });
        }
        
        const result = azureMapsService.calculateDistance(
            parseFloat(lat1), parseFloat(lon1),
            parseFloat(lat2), parseFloat(lon2)
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/geofence/check:
 *   post:
 *     summary: Check if point is within geofence
 *     tags: [🗺️ Maps]
 *     description: Verify if a location is inside a circular geofence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - geofence
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               geofence:
 *                 type: object
 *                 properties:
 *                   centerLat:
 *                     type: number
 *                   centerLon:
 *                     type: number
 *                   radiusMeters:
 *                     type: number
 *     responses:
 *       200:
 *         description: Geofence check result
 */
export const checkGeofence = async (req, res) => {
    try {
        const { latitude, longitude, geofence } = req.body;
        
        if (!latitude || !longitude || !geofence) {
            return res.status(400).json({ success: false, error: 'Latitude, longitude, and geofence are required' });
        }
        
        const result = azureMapsService.checkGeofence(latitude, longitude, geofence);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/timezone:
 *   get:
 *     summary: Get timezone for location
 *     tags: [🗺️ Maps]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Timezone information
 */
export const getTimezone = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }
        
        const result = await azureMapsService.getTimezone(parseFloat(latitude), parseFloat(longitude));
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * @swagger
 * /api/maps/weather:
 *   get:
 *     summary: Get weather for location
 *     tags: [🗺️ Maps]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Weather information
 */
export const getWeather = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }
        
        const result = await azureMapsService.getWeather(parseFloat(latitude), parseFloat(longitude));
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getMapsConfig,
    geocode,
    reverseGeocode,
    searchPOI,
    searchEmergency,
    getRoute,
    getDistance,
    checkGeofence,
    getTimezone,
    getWeather
};
