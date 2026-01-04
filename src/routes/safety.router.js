import { Router } from 'express';
import {
    getSafetyByCoordinates,
    getSafetyByCity,
    getNearbyLocations,
    getSafetyStats,
    getAllSafetyScores
} from '../controllers/safety.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: 🛡️ Safety
 *   description: Location safety score APIs based on crime data
 */

/**
 * @swagger
 * /api/safety/location:
 *   get:
 *     summary: Get safety score for coordinates
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 26.15
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 91.73
 *     responses:
 *       200:
 *         description: Safety information for the location
 */
router.get('/location', getSafetyByCoordinates);

/**
 * @swagger
 * /api/safety/city:
 *   get:
 *     summary: Get safety score by city name
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: Guwahati
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         example: Assam
 *     responses:
 *       200:
 *         description: Safety information for the city
 */
router.get('/city', getSafetyByCity);

/**
 * @swagger
 * /api/safety/nearby:
 *   get:
 *     summary: Find nearby safe locations
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 50
 *         description: Radius in km
 *       - in: query
 *         name: minSafety
 *         schema:
 *           type: number
 *           default: 0
 *         description: Minimum safety score (0-100)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of nearby safe locations
 */
router.get('/nearby', getNearbyLocations);

/**
 * @swagger
 * /api/safety/stats:
 *   get:
 *     summary: Get safety statistics
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state (optional)
 *     responses:
 *       200:
 *         description: Safety statistics
 */
router.get('/stats', getSafetyStats);

/**
 * @swagger
 * /api/safety/all:
 *   get:
 *     summary: Get all safety scores for map overlay
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: All safety scores
 */
router.get('/all', getAllSafetyScores);

export default router;
