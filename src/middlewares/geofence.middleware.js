import blockchainClientService from '../services/blockchain-client.service.js';

// Role-based authorization middleware
export const requireAdminRole = async (req, res, next) => {
    try {
        // Check if user has admin or authority role
        const user = req.user;
        if (!user) {
            return res.status(401).json({

                success: false,
                message: 'Authentication required'
            });
        }

        // For now, check if user email contains admin domains
        // TODO: Implement proper role system in database
        const adminDomains = ['@admin.yatrasuraksha.com', '@authority.gov.in'];
        const isAdmin = adminDomains.some(domain => user.email?.includes(domain)) ||
                       user.email === process.env.ADMIN_EMAIL;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for geofence operations. Current user: ' + user.email
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating admin role',
            error: error.message
        });
    }
};

// Enhanced geofence validation
export const validateGeofenceData = (req, res, next) => {
    const { name, coordinates, type, radius, riskLevel } = req.body;

    // Validate name
    if (name && (typeof name !== 'string' || name.trim().length < 3)) {
        return res.status(400).json({
            success: false,
            message: 'Name must be at least 3 characters long'
        });
    }

    // Validate coordinates
    if (coordinates) {
        // Handle object format: { latitude: x, longitude: y }
        if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
            if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude must be numbers'
                });
            }
            // Validate coordinate ranges
            if (coordinates.longitude < -180 || coordinates.longitude > 180 || 
                coordinates.latitude < -90 || coordinates.latitude > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'Coordinates out of valid range'
                });
            }
        }
        // Handle array format
        else if (Array.isArray(coordinates)) {
            // For polygon, validate coordinate structure
            if (Array.isArray(coordinates[0])) {
                for (const coord of coordinates) {
                    if (!Array.isArray(coord) || coord.length !== 2 || 
                        typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid coordinate format. Expected [longitude, latitude]'
                        });
                    }
                    // Validate longitude/latitude ranges
                    if (coord[0] < -180 || coord[0] > 180 || coord[1] < -90 || coord[1] > 90) {
                        return res.status(400).json({
                            success: false,
                            message: 'Coordinates out of valid range'
                        });
                    }
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Coordinates must be an array or object with latitude/longitude'
            });
        }
    }

    // Validate radius
    if (radius !== undefined) {
        if (typeof radius !== 'number' || radius <= 0 || radius > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Radius must be between 1 and 50000 meters'
            });
        }
    }

    // Validate risk level
    if (riskLevel !== undefined) {
        if (!Number.isInteger(riskLevel) || riskLevel < 1 || riskLevel > 10) {
            return res.status(400).json({
                success: false,
                message: 'Risk level must be an integer between 1 and 10'
            });
        }
    }

    // Validate type
    const validTypes = ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json({
            success: false,
            message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
    }

    next();
};

// Geofence event logging helper for blockchain integration
export const logGeofenceEvent = async (tourist, geofence, eventType, location) => {
    try {
        if (!tourist.blockchainDID) {
            console.log('⚠️ Tourist has no blockchain DID, skipping geofence blockchain logging');
            return null;
        }

        const geofenceEventData = {
            touristDID: tourist.blockchainDID,
            touristId: tourist.digitalId,
            geofenceId: geofence._id.toString(),
            geofenceName: geofence.name,
            eventType, // 'entered', 'exited', 'violation'
            location: {
                coordinates: location.coordinates,
                address: location.address || `${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`
            },
            riskLevel: geofence.riskLevel,
            alertGenerated: geofence.type === 'danger' || geofence.type === 'restricted'
        };

        const result = await blockchainClientService.logIncident({
            touristDID: geofenceEventData.touristDID,
            touristId: geofenceEventData.touristId,  
            incidentType: 'geofence_event',
            severity: geofenceEventData.riskLevel === 'high' ? 'high' : 'medium',
            description: `Geofence ${eventType}: ${geofenceEventData.geofenceName}`,
            location: geofenceEventData.location,
            metadata: geofenceEventData
        });
        
        if (result.success) {
            console.log(`🔗 Geofence ${eventType} event logged to blockchain:`, result.txId);
        }
        return result;
    } catch (error) {
        console.warn('⚠️ Failed to log geofence event to blockchain:', error.message);
        return null;
    }
};

// Middleware to check geofence violations and log to blockchain
export const checkGeofenceViolations = async (req, res, next) => {
    try {
        // This middleware can be used in location update endpoints
        // to automatically check for geofence events
        const { touristId, latitude, longitude } = req.body;
        
        if (!touristId || !latitude || !longitude) {
            return next(); // Skip if no location data
        }

        const Tourist = (await import('../models/tourist.model.js')).default;
        const GeoFence = (await import('../models/geoFence.model.js')).default;
        
        const tourist = await Tourist.findById(touristId);
        if (!tourist) {
            return next();
        }

        // Find geofences near the location
        const nearbyGeofences = await GeoFence.find({
            geometry: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 1000 // 1km radius
                }
            }
        });

        // Log geofence entries/exits
        for (const geofence of nearbyGeofences) {
            await logGeofenceEvent(tourist, geofence, 'entered', {
                coordinates: [longitude, latitude]
            });
        }

        next();
    } catch (error) {
        console.warn('⚠️ Geofence violation check failed:', error.message);
        next(); // Continue even if geofence check fails
    }
};