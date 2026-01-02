/**
 * Maps Router
 * Routes for Azure Maps API endpoints
 */

import express from 'express';
import * as mapsController from '../controllers/maps.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 🗺️ Maps
 *   description: Azure Maps API endpoints for geocoding, routing, and location services
 */

// GET /api/maps/config - Get maps configuration
router.get('/config', mapsController.getMapsConfig);

// GET /api/maps/geocode - Geocode address to coordinates
router.get('/geocode', mapsController.geocode);

// GET /api/maps/reverse-geocode - Reverse geocode coordinates to address
router.get('/reverse-geocode', mapsController.reverseGeocode);

// GET /api/maps/search/poi - Search points of interest
router.get('/search/poi', mapsController.searchPOI);

// GET /api/maps/search/emergency - Search emergency services
router.get('/search/emergency', mapsController.searchEmergency);

// GET /api/maps/route - Get route between two points
router.get('/route', mapsController.getRoute);

// GET /api/maps/distance - Calculate distance between points
router.get('/distance', mapsController.getDistance);

// POST /api/maps/geofence/check - Check if point is in geofence
router.post('/geofence/check', mapsController.checkGeofence);

// GET /api/maps/timezone - Get timezone for location
router.get('/timezone', mapsController.getTimezone);

// GET /api/maps/weather - Get weather for location
router.get('/weather', mapsController.getWeather);

export default router;
