import SafetyScore from '../models/safetyScore.model.js';

/**
 * @swagger
 * /api/safety/location:
 *   get:
 *     summary: Get safety score for a location by coordinates
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Safety information for the location
 */
export const getSafetyByCoordinates = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Missing lat or lng parameters'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        // Check if within India bounds
        if (latitude < 6.0 || latitude > 37.5 || longitude < 68.0 || longitude > 97.5) {
            return res.status(400).json({
                success: false,
                message: 'Location is outside India',
                inIndia: false
            });
        }

        // Find nearest location with safety data
        const nearestLocation = await SafetyScore.findOne({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 100000 // 100km
                }
            }
        });

        if (!nearestLocation) {
            return res.status(404).json({
                success: false,
                message: 'No safety data available for this location'
            });
        }

        // Calculate distance
        const distance = calculateDistance(
            latitude, longitude,
            nearestLocation.latitude, nearestLocation.longitude
        );

        res.json({
            success: true,
            data: {
                queryLocation: { latitude, longitude },
                nearestCity: {
                    name: nearestLocation.name,
                    state: nearestLocation.state,
                    district: nearestLocation.district,
                    coordinates: {
                        latitude: nearestLocation.latitude,
                        longitude: nearestLocation.longitude
                    },
                    distanceKm: Math.round(distance * 100) / 100
                },
                safety: {
                    score: nearestLocation.safetyScore,
                    riskLevel: nearestLocation.riskLevel,
                    crimeRate: nearestLocation.crimeRate,
                    population: nearestLocation.population,
                    populationDensity: nearestLocation.populationDensity
                }
            }
        });
    } catch (error) {
        console.error('Error getting safety by coordinates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get safety information',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/safety/city:
 *   get:
 *     summary: Get safety score for a city by name
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State name (optional, for disambiguation)
 *     responses:
 *       200:
 *         description: Safety information for the city
 */
export const getSafetyByCity = async (req, res) => {
    try {
        const { name, state } = req.query;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Missing city name parameter'
            });
        }

        // Build query
        const query = {
            name: { $regex: new RegExp(name, 'i') }
        };
        
        if (state) {
            query.state = { $regex: new RegExp(state, 'i') };
        }

        const locations = await SafetyScore.find(query)
            .sort({ safetyScore: -1 })
            .limit(10);

        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'City not found in safety database'
            });
        }

        res.json({
            success: true,
            data: {
                query: { name, state },
                results: locations.map(loc => ({
                    name: loc.name,
                    state: loc.state,
                    district: loc.district,
                    coordinates: {
                        latitude: loc.latitude,
                        longitude: loc.longitude
                    },
                    safety: {
                        score: loc.safetyScore,
                        rank: loc.safetyRank,
                        riskLevel: loc.riskLevel,
                        crimeRate: loc.crimeRate
                    }
                }))
            }
        });
    } catch (error) {
        console.error('Error getting safety by city:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get safety information',
            error: error.message
        });
    }
};

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
 *         description: Search radius in kilometers
 *       - in: query
 *         name: minSafety
 *         schema:
 *           type: number
 *           default: 0
 *         description: Minimum safety score filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of nearby safe locations
 */
export const getNearbyLocations = async (req, res) => {
    try {
        const { lat, lng, radius = 50, minSafety = 0, limit = 10 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Missing lat or lng parameters'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusMeters = parseFloat(radius) * 1000;
        const minScore = parseFloat(minSafety);
        const maxResults = Math.min(parseInt(limit), 50);

        const locations = await SafetyScore.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radiusMeters
                }
            },
            safetyScore: { $gte: minScore }
        }).limit(maxResults);

        // Add distance to each result
        const resultsWithDistance = locations.map(loc => {
            const distance = calculateDistance(
                latitude, longitude,
                loc.latitude, loc.longitude
            );
            return {
                name: loc.name,
                state: loc.state,
                district: loc.district,
                coordinates: {
                    latitude: loc.latitude,
                    longitude: loc.longitude
                },
                distanceKm: Math.round(distance * 100) / 100,
                safety: {
                    score: loc.safetyScore,
                    riskLevel: loc.riskLevel
                }
            };
        });

        res.json({
            success: true,
            data: {
                query: {
                    latitude,
                    longitude,
                    radiusKm: parseFloat(radius),
                    minSafetyScore: minScore
                },
                count: resultsWithDistance.length,
                locations: resultsWithDistance
            }
        });
    } catch (error) {
        console.error('Error getting nearby locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get nearby locations',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/safety/stats:
 *   get:
 *     summary: Get safety statistics (by state or overall)
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *     responses:
 *       200:
 *         description: Safety statistics
 */
export const getSafetyStats = async (req, res) => {
    try {
        const { state } = req.query;
        
        const matchStage = state 
            ? { $match: { state: { $regex: new RegExp(state, 'i') } } }
            : { $match: {} };

        const stats = await SafetyScore.aggregate([
            matchStage,
            {
                $group: {
                    _id: '$riskLevel',
                    count: { $sum: 1 },
                    avgSafetyScore: { $avg: '$safetyScore' },
                    avgCrimeRate: { $avg: '$crimeRate' }
                }
            },
            { $sort: { avgSafetyScore: -1 } }
        ]);

        const totalCities = await SafetyScore.countDocuments(
            state ? { state: { $regex: new RegExp(state, 'i') } } : {}
        );

        const safestCities = await SafetyScore.find(
            state ? { state: { $regex: new RegExp(state, 'i') } } : {}
        )
            .sort({ safetyScore: -1 })
            .limit(5)
            .select('name state safetyScore riskLevel');

        const leastSafeCities = await SafetyScore.find(
            state ? { state: { $regex: new RegExp(state, 'i') } } : {}
        )
            .sort({ safetyScore: 1 })
            .limit(5)
            .select('name state safetyScore riskLevel');

        res.json({
            success: true,
            data: {
                filter: state || 'All India',
                totalCities,
                riskDistribution: stats.map(s => ({
                    riskLevel: s._id,
                    count: s.count,
                    avgSafetyScore: Math.round(s.avgSafetyScore * 100) / 100,
                    avgCrimeRate: Math.round(s.avgCrimeRate * 100) / 100
                })),
                safestCities: safestCities.map(c => ({
                    name: c.name,
                    state: c.state,
                    safetyScore: c.safetyScore,
                    riskLevel: c.riskLevel
                })),
                leastSafeCities: leastSafeCities.map(c => ({
                    name: c.name,
                    state: c.state,
                    safetyScore: c.safetyScore,
                    riskLevel: c.riskLevel
                }))
            }
        });
    } catch (error) {
        console.error('Error getting safety stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get safety statistics',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/safety/all:
 *   get:
 *     summary: Get all safety scores (for map overlay)
 *     tags: [🛡️ Safety]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *         description: Minimum safety score
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: number
 *         description: Maximum safety score
 *     responses:
 *       200:
 *         description: All safety scores for map display
 */
export const getAllSafetyScores = async (req, res) => {
    try {
        const { state, minScore, maxScore } = req.query;
        
        const query = {};
        
        if (state) {
            query.state = { $regex: new RegExp(state, 'i') };
        }
        
        if (minScore || maxScore) {
            query.safetyScore = {};
            if (minScore) query.safetyScore.$gte = parseFloat(minScore);
            if (maxScore) query.safetyScore.$lte = parseFloat(maxScore);
        }

        const locations = await SafetyScore.find(query)
            .select('name state district latitude longitude safetyScore riskLevel')
            .sort({ safetyScore: -1 });

        res.json({
            success: true,
            data: {
                count: locations.length,
                locations: locations.map(loc => ({
                    name: loc.name,
                    state: loc.state,
                    district: loc.district,
                    lat: loc.latitude,
                    lng: loc.longitude,
                    safetyScore: loc.safetyScore,
                    riskLevel: loc.riskLevel
                }))
            }
        });
    } catch (error) {
        console.error('Error getting all safety scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get safety scores',
            error: error.message
        });
    }
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}
