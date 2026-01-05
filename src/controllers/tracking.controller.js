import { LocationHistory, Alert, Device } from '../models/tracking.model.js'
import Tourist from '../models/tourist.model.js'
import GeoFence from '../models/geoFence.model.js'
import { getConnectedClientsInfo } from '../services/socket.service.js'
import blockchainClientService from '../services/blockchain-client.service.js'
import inactivityService from '../services/inactivity.service.js'

export const updateLocation = async (req, res) => {
    try {
        const {
            touristId,
            latitude,
            longitude,
            accuracy = 10,
            speed = 0,
            heading = 0,
            altitude = 0,
            batteryLevel = 100,
            source = 'gps'
        } = req.body

        if (!touristId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID, latitude, and longitude are required'
            })
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            })
        }

        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        const locationRecord = new LocationHistory({
            touristId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            timestamp: new Date(),
            accuracy,
            speed,
            heading,
            altitude,
            batteryLevel,
            source
        })

        await locationRecord.save()

        await Tourist.findByIdAndUpdate(touristId, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastLocationUpdate: new Date(),
            isActive: true
        })

        // Reactivate tourist if they were inactive due to no location updates
        await inactivityService.reactivateTourist(touristId);

        // Log location update to blockchain for immutable tracking
        if (tourist.blockchainDID) {
            // Fire and forget - don't block the response
            blockchainClientService.logLocationUpdate({
                touristDID: tourist.blockchainDID,
                touristId: tourist.digitalId,
                coordinates: [longitude, latitude],
                accuracy,
                source,
                deviceId: req.body.deviceId || 'mobile_app',
                batteryLevel,
                address: req.body.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }).catch(error => {
                console.warn('⚠️ Failed to log location to blockchain:', error.message);
            });
        }

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                locationId: locationRecord._id,
                timestamp: locationRecord.timestamp
            }
        })

    } catch (error) {
        console.error('Error updating location:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update location'
        })
    }
}

export const getLocationHistory = async (req, res) => {
    try {
        const { touristId } = req.params
        const { limit = 100, hours = 24 } = req.query

        // Validate if tourist exists
        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

        const locations = await LocationHistory.find({
            touristId,
            timestamp: { $gte: startTime }
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean()

        const formattedLocations = locations.map(loc => ({
            id: loc._id,
            latitude: loc.location.coordinates[1],
            longitude: loc.location.coordinates[0],
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            altitude: loc.altitude,
            batteryLevel: loc.batteryLevel,
            timestamp: loc.timestamp,
            source: loc.source
        }))

        res.json({
            success: true,
            data: {
                touristId,
                touristName: tourist.personalInfo?.name || 'Unknown',
                locations: formattedLocations,
                count: formattedLocations.length
            }
        })

    } catch (error) {
        console.error('Error getting location history:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history'
        })
    }
}

export const getCurrentLocation = async (req, res) => {
    try {
        const { touristId } = req.params

        const tourist = await Tourist.findById(touristId).lean()
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        let currentLocation = null
        if (tourist.currentLocation && tourist.currentLocation.coordinates) {
            currentLocation = {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0],
                lastUpdate: tourist.lastLocationUpdate
            }
        }

        res.json({
            success: true,
            data: {
                touristId,
                name: tourist.name,
                currentLocation,
                isActive: tourist.isActive,
                status: tourist.status
            }
        })

    } catch (error) {
        console.error('Error getting current location:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve current location'
        })
    }
}

export const getHeatmapData = async (req, res) => {
    try {
        const { hours = 24 } = req.query
        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

        const heatmapData = await LocationHistory.aggregate([
            {
                $match: {
                    timestamp: { $gte: startTime }
                }
            },
            {
                $group: {
                    _id: {
                        lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 4] },
                        lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 4] }
                    },
                    count: { $sum: 1 },
                    tourists: { $addToSet: '$touristId' }
                }
            },
            {
                $project: {
                    latitude: '$_id.lat',
                    longitude: '$_id.lng',
                    weight: '$count',
                    touristCount: { $size: '$tourists' },
                    _id: 0
                }
            },
            {
                $sort: { weight: -1 }
            }
        ])

        res.json({
            success: true,
            data: {
                heatmapData,
                count: heatmapData.length,
                timeRange: `${hours} hours`
            }
        })

    } catch (error) {
        console.error('Error getting heatmap data:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve heatmap data'
        })
    }
}

export const getTouristStats = async (req, res) => {
    try {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        const [
            totalTourists,
            activeTourists,
            recentlyActive,
            emergencyAlerts,
            totalAlerts,
            connectedDevices,
            locationUpdatesLast24h
        ] = await Promise.all([
            Tourist.countDocuments(),
            Tourist.countDocuments({ 
                isActive: true, 
                lastLocationUpdate: { $gte: oneDayAgo } 
            }),
            Tourist.countDocuments({ 
                lastLocationUpdate: { $gte: oneHourAgo } 
            }),
            Alert.countDocuments({ 
                severity: 'emergency', 
                'acknowledgment.isAcknowledged': false 
            }),
            Alert.countDocuments({ 
                createdAt: { $gte: oneDayAgo } 
            }),
            Device.countDocuments({ 
                status: 'active', 
                'currentMetrics.lastPing': { $gte: oneDayAgo } 
            }),
            LocationHistory.countDocuments({ 
                timestamp: { $gte: oneDayAgo } 
            })
        ])

        const clientsInfo = getConnectedClientsInfo()

        res.json({
            success: true,
            data: {
                tourists: {
                    total: totalTourists,
                    active: activeTourists,
                    recentlyActive
                },
                alerts: {
                    emergency: emergencyAlerts,
                    total: totalAlerts
                },
                devices: {
                    connected: connectedDevices
                },
                tracking: {
                    locationUpdatesLast24h
                },
                realtime: {
                    connectedClients: clientsInfo.total,
                    adminClients: clientsInfo.admins,
                    touristClients: clientsInfo.tourists
                },
                timestamp: now
            }
        })

    } catch (error) {
        console.error('Error getting tourist stats:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        })
    }
}

export const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({
            'acknowledgment.isAcknowledged': false
        })
        .populate('touristId', 'name phone nationality')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()

        const formattedAlerts = alerts.map(alert => ({
            id: alert._id,
            alertId: alert.alertId,
            tourist: alert.touristId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            location: alert.location ? {
                latitude: alert.location.coordinates[1],
                longitude: alert.location.coordinates[0]
            } : null,
            timestamp: alert.createdAt,
            metadata: alert.metadata
        }))

        res.json({
            success: true,
            data: {
                alerts: formattedAlerts,
                count: formattedAlerts.length
            }
        })

    } catch (error) {
        console.error('Error getting active alerts:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active alerts'
        })
    }
}

export const acknowledgeAlert = async (req, res) => {
    try {
        const { alertId } = req.params
        const { acknowledgedBy = 'admin', response = 'Alert acknowledged' } = req.body || {}

        // Try to find and update by alertId field first
        let alert = await Alert.findOneAndUpdate(
            { alertId },
            {
                'acknowledgment.isAcknowledged': true,
                'acknowledgment.acknowledgedBy': acknowledgedBy,
                'acknowledgment.acknowledgedAt': new Date(),
                'acknowledgment.response': response
            },
            { new: true }
        )

        // If not found by alertId, try by _id (MongoDB ObjectId)
        if (!alert) {
            const mongoose = await import('mongoose');
            if (mongoose.default.Types.ObjectId.isValid(alertId)) {
                alert = await Alert.findByIdAndUpdate(
                    alertId,
                    {
                        'acknowledgment.isAcknowledged': true,
                        'acknowledgment.acknowledgedBy': acknowledgedBy,
                        'acknowledgment.acknowledgedAt': new Date(),
                        'acknowledgment.response': response
                    },
                    { new: true }
                )
            }
        }

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            })
        }

        res.json({
            success: true,
            message: 'Alert acknowledged successfully',
            data: { alertId: alert.alertId || alertId }
        })

    } catch (error) {
        console.error('Error acknowledging alert:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert'
        })
    }
}

export const createEmergencyAlert = async (req, res) => {
    try {
        const { touristId, latitude, longitude, message, type = 'panic_button', severity = 'high' } = req.body

        if (!touristId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID, latitude, and longitude are required'
            })
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            })
        }

        // Validate if tourist exists BEFORE creating alert
        const tourist = await Tourist.findById(touristId)
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            })
        }

        const alert = new Alert({
            alertId: `emergency_${Date.now()}_${touristId}`,
            touristId,
            type,
            severity: 'emergency',
            message: {
                english: message || 'Emergency alert triggered',
                hindi: 'आपातकालीन अलर्ट सक्रिय'
            },
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            metadata: {
                triggeredBy: 'api',
                source: 'rest_api'
            }
        })

        await alert.save()

        // Log incident to blockchain for immutable record
        if (tourist.blockchainDID) {
            // Fire and forget - don't block the response
            blockchainClientService.logIncident({
                touristDID: tourist.blockchainDID,
                touristId: tourist.digitalId,
                incidentType: 'emergency_alert',
                severity: severity || 'high',
                description: message || 'Emergency alert triggered',
                location: {
                    latitude,
                    longitude,
                    address: `${latitude}, ${longitude}`
                },
                timestamp: new Date(),
                alertId: alert._id.toString(),
                status: 'open',
                reportedBy: tourist.personalInfo.name || 'Tourist',
                contactInfo: tourist.personalInfo.phone || tourist.personalInfo.email
            }).catch(error => {
                console.warn('⚠️ Failed to log emergency incident to blockchain:', error.message);
            });
        }

        // Update tourist status - use findByIdAndUpdate with error handling
        const updatedTourist = await Tourist.findByIdAndUpdate(
            touristId, 
            {
                status: 'emergency',
                statusUpdatedAt: new Date(),
                statusReason: 'Emergency alert sent',
                lastEmergencyAlert: new Date()
            },
            { new: true }
        )

        if (!updatedTourist) {
            // If tourist was deleted between checks, clean up the alert
            await Alert.findByIdAndDelete(alert._id)
            return res.status(404).json({
                success: false,
                message: 'Tourist not found during status update'
            })
        }

        res.json({
            success: true,
            message: 'Emergency alert created successfully',
            data: {
                alertId: alert.alertId,
                timestamp: alert.createdAt
            }
        })

    } catch (error) {
        console.error('Error creating emergency alert:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create emergency alert'
        })
    }
}

/**
 * Get emergency alerts with optional filtering
 * @route GET /api/tracking/alerts/emergency
 */
export const getEmergencyAlerts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            touristId, 
            severity, 
            acknowledged, 
            startDate, 
            endDate 
        } = req.query;

        // Build filter object
        const filter = {};

        // Filter by tourist ID if provided
        if (touristId) {
            filter.touristId = touristId;
        }

        // Filter by severity if provided
        if (severity) {
            filter.severity = severity;
        }

        // Filter by acknowledgment status if provided
        if (acknowledged !== undefined) {
            filter['acknowledgment.isAcknowledged'] = acknowledged === 'true';
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get alerts with tourist information
        const alerts = await Alert.find(filter)
            .populate('touristId', 'digitalId personalInfo.name personalInfo.email personalInfo.phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalAlerts = await Alert.countDocuments(filter);

        // Format the response
        const formattedAlerts = alerts.map(alert => ({
            id: alert._id,
            alertId: alert.alertId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            location: alert.location ? {
                latitude: alert.location.coordinates[1],
                longitude: alert.location.coordinates[0]
            } : null,
            tourist: alert.touristId ? {
                id: alert.touristId._id,
                digitalId: alert.touristId.digitalId,
                name: alert.touristId.personalInfo?.name,
                email: alert.touristId.personalInfo?.email,
                phone: alert.touristId.personalInfo?.phone
            } : null,
            acknowledgment: alert.acknowledgment,
            metadata: alert.metadata,
            createdAt: alert.createdAt,
            updatedAt: alert.updatedAt
        }));

        res.status(200).json({
            success: true,
            message: 'Emergency alerts retrieved successfully',
            data: {
                alerts: formattedAlerts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalAlerts / parseInt(limit)),
                    totalAlerts,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting emergency alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve emergency alerts',
            error: error.message
        });
    }
};

/**
 * Acknowledge and delete all emergency alerts for a tourist
 * @route DELETE /api/tracking/alerts/emergency/tourist/:touristId
 */
export const acknowledgeAndDeleteTouristAlerts = async (req, res) => {
    try {
        const { touristId } = req.params;
        const { response, acknowledgedBy } = req.body;

        if (!touristId) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID is required'
            });
        }

        // Validate if tourist exists
        const tourist = await Tourist.findById(touristId).select('digitalId personalInfo.name status');
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            });
        }

        // Find all unacknowledged alerts for this tourist
        const alerts = await Alert.find({
            touristId: touristId,
            'acknowledgment.isAcknowledged': false
        });

        if (alerts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No unacknowledged alerts found for this tourist'
            });
        }

        const acknowledgedAt = new Date();
        const acknowledgedByValue = acknowledgedBy || 'system';
        const responseText = response || `All alerts for tourist ${tourist.digitalId} acknowledged and resolved`;

        // Update all alerts with acknowledgment information
        const updatedAlerts = await Alert.updateMany(
            {
                touristId: touristId,
                'acknowledgment.isAcknowledged': false
            },
            {
                'acknowledgment.isAcknowledged': true,
                'acknowledgment.acknowledgedAt': acknowledgedAt,
                'acknowledgment.acknowledgedBy': acknowledgedByValue,
                'acknowledgment.response': responseText,
                resolvedAt: acknowledgedAt,
                resolvedBy: acknowledgedByValue
            }
        );

        // Log acknowledgments to blockchain if available
        if (tourist.digitalId && alerts.length > 0) {
            // Fire and forget - don't block the response
            Promise.all(alerts.map(alert => 
                blockchainClientService.logIncident({
                    touristDID: tourist.digitalId,
                    incidentId: alert.alertId,
                    type: 'bulk_alert_acknowledgment',
                    severity: 'info',
                    location: alert.location ? {
                        coordinates: alert.location.coordinates,
                        address: `${alert.location.coordinates[1]}, ${alert.location.coordinates[0]}`
                    } : null,
                    description: `Bulk acknowledgment: ${responseText}`,
                    status: 'resolved',
                    reportedBy: acknowledgedByValue,
                    resolvedAt: acknowledgedAt.toISOString()
                })
            )).then(() => {
                console.log(`🔗 ${alerts.length} alert acknowledgments logged to blockchain`);
            }).catch(error => {
                console.warn('⚠️ Failed to log alert acknowledgments to blockchain:', error.message);
            });
        }

        // Update tourist status back to active
        await Tourist.findByIdAndUpdate(
            touristId,
            {
                status: 'active',
                statusUpdatedAt: new Date(),
                statusReason: 'Emergency alerts acknowledged',
                lastStatusUpdate: new Date()
            }
        );

        // Delete all acknowledged alerts for this tourist
        const deletedResult = await Alert.deleteMany({
            touristId: touristId,
            'acknowledgment.isAcknowledged': true
        });

        res.status(200).json({
            success: true,
            message: `All emergency alerts for tourist acknowledged and removed successfully`,
            data: {
                touristId: tourist._id,
                digitalId: tourist.digitalId,
                touristName: tourist.personalInfo?.name,
                alertsProcessed: updatedAlerts.modifiedCount,
                alertsDeleted: deletedResult.deletedCount,
                acknowledgedAt: acknowledgedAt,
                acknowledgedBy: acknowledgedByValue,
                response: responseText,
                updatedStatus: 'active'
            }
        });

    } catch (error) {
        console.error('Error acknowledging and deleting tourist alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge and delete tourist alerts',
            error: error.message
        });
    }
};

export const getGeofences = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            type, 
            isActive, 
            riskLevel, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            all = 'false'
        } = req.query

        // Build filter object
        const filter = {}
        
        if (type) {
            filter.type = type
        }
        
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true'
        }
        
        if (riskLevel) {
            filter.riskLevel = parseInt(riskLevel)
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        // Build sort object
        const sort = {}
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1

        // Check if requesting all geofences without pagination
        const requestAll = all === 'true' || String(limit).toLowerCase() === 'all' || limit === '0'

        if (requestAll) {
            // Return all geofences without pagination
            const [geofences, totalCount] = await Promise.all([
                GeoFence.find(filter)
                    .sort(sort)
                    .select('-alertMessage -metadata -createdBy -lastModifiedBy -__v')
                    .lean(),
                GeoFence.countDocuments(filter)
            ])

            res.json({
                success: true,
                data: {
                    geofences,
                    totalCount
                }
            })
        } else {
            // Use pagination
            const skip = (parseInt(page) - 1) * parseInt(limit)
            
            // Execute query with pagination
            const [geofences, totalCount] = await Promise.all([
                GeoFence.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .select('-alertMessage -metadata -createdBy -lastModifiedBy -__v')
                    .lean(),
                GeoFence.countDocuments(filter)
            ])

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / parseInt(limit))
            const hasNextPage = parseInt(page) < totalPages
            const hasPrevPage = parseInt(page) > 1

            res.json({
                success: true,
                data: {
                    geofences,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalCount,
                        limit: parseInt(limit),
                        hasNextPage,
                        hasPrevPage
                    }
                }
            })
        }

    } catch (error) {
        console.error('Error getting geofences:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve geofences'
        })
    }
}

export const createGeofence = async (req, res) => {
    try {
        const { name, coordinates, type, description, radius, riskLevel, alertMessage, restrictions, metadata } = req.body

        if (!name || !coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name and coordinates are required'
            })
        }

        // Check for duplicate names
        const existingGeofence = await GeoFence.findOne({ 
            name: name.trim(), 
            isActive: true 
        });
        if (existingGeofence) {
            return res.status(409).json({
                success: false,
                message: 'A geofence with this name already exists'
            });
        }

        // Handle different coordinate formats
        let processedCoordinates;
        if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
            // Object format: { latitude: x, longitude: y }
            processedCoordinates = [coordinates.longitude, coordinates.latitude];
        } else if (Array.isArray(coordinates)) {
            // Array format: [longitude, latitude] or [[lng, lat], [lng, lat], ...]
            processedCoordinates = coordinates;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates format. Expected {latitude: number, longitude: number} or array format'
            });
        }

        // Create proper geometry based on type
        let geometry;
        if (radius) {
            // For circles, store as Point with radius field
            geometry = {
                type: 'Point',
                coordinates: processedCoordinates
            };
        } else {
            // For polygons, store as Polygon
            geometry = {
                type: 'Polygon',
                coordinates: [processedCoordinates] // Polygon needs array of arrays
            };
        }

        // Create geofence with validated data
        const geofence = new GeoFence({
            name: name.trim(),
            type: type || 'warning',
            description: description?.trim(),
            geometry: geometry,
            radius: radius, // Store radius as separate field
            riskLevel: riskLevel || 5,
            alertMessage: alertMessage || {
                english: `You are entering ${name}`,
                hindi: `आप ${name} में प्रवेश कर रहे हैं`
            },
            restrictions: restrictions || {},
            metadata: metadata || {},
            isActive: true,
            createdBy: 'system' // No user authentication required for admin APIs
        })

        await geofence.save()

        // Log geofence creation for audit
        console.log(`Geofence created: ${geofence.name} by system (no auth required)`)

        res.status(201).json({
            success: true,
            message: 'Geofence created successfully',
            data: {
                id: geofence._id,
                name: geofence.name,
                type: geofence.type,
                geometry: geofence.geometry,
                riskLevel: geofence.riskLevel,
                isActive: geofence.isActive,
                createdAt: geofence.createdAt
            }
        })

    } catch (error) {
        console.error('Error creating geofence:', error)
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            })
        }
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A geofence with this name already exists'
            })
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create geofence'
        })
    }
}

export const updateGeofence = async (req, res) => {
    try {
        const { fenceId } = req.params
        const updates = req.body

        // Find existing geofence
        const existingGeofence = await GeoFence.findById(fenceId)
        if (!existingGeofence) {
            return res.status(404).json({
                success: false,
                message: 'Geofence not found'
            })
        }

        // No ownership check required - admin API has public access

        // Validate and sanitize updates
        const allowedUpdates = ['name', 'description', 'type', 'geometry', 'riskLevel', 'alertMessage', 'restrictions', 'metadata', 'isActive']
        const sanitizedUpdates = {}

        for (const key of Object.keys(updates)) {
            if (allowedUpdates.includes(key)) {
                sanitizedUpdates[key] = updates[key]
            }
        }

        // Check for name conflicts if name is being updated
        if (sanitizedUpdates.name && sanitizedUpdates.name !== existingGeofence.name) {
            const duplicateName = await GeoFence.findOne({ 
                name: sanitizedUpdates.name.trim(), 
                _id: { $ne: fenceId },
                isActive: true 
            })
            if (duplicateName) {
                return res.status(409).json({
                    success: false,
                    message: 'A geofence with this name already exists'
                })
            }
        }

        // Add audit trail
        sanitizedUpdates.lastModifiedBy = 'system' // No user authentication required for admin APIs
        sanitizedUpdates.updatedAt = new Date()

        const geofence = await GeoFence.findByIdAndUpdate(
            fenceId,
            sanitizedUpdates,
            { new: true, runValidators: true }
        )

        // Log update for audit
        console.log(`Geofence updated: ${geofence.name} by system (no auth required)`)

        res.json({
            success: true,
            message: 'Geofence updated successfully',
            data: {
                id: geofence._id,
                name: geofence.name,
                type: geofence.type,
                geometry: geofence.geometry,
                riskLevel: geofence.riskLevel,
                isActive: geofence.isActive,
                updatedAt: geofence.updatedAt
            }
        })

    } catch (error) {
        console.error('Error updating geofence:', error)
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            })
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update geofence'
        })
    }
}

export const deleteGeofence = async (req, res) => {
    try {
        const { fenceId } = req.params

        // Find the geofence first to check ownership
        const geofence = await GeoFence.findById(fenceId)
        if (!geofence) {
            return res.status(404).json({
                success: false,
                message: 'Geofence not found'
            })
        }

        // No ownership check required - admin API has public access

        // Check if geofence is referenced in active alerts
        const activeAlerts = await Alert.countDocuments({
            geoFenceId: fenceId,
            'acknowledgment.isAcknowledged': false
        })

        if (activeAlerts > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete geofence. It has ${activeAlerts} active alerts. Please acknowledge all alerts first.`
            })
        }

        // Soft delete - mark as inactive instead of hard delete for audit trail
        await GeoFence.findByIdAndUpdate(fenceId, {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: 'system' // No user authentication required for admin APIs
        })

        // Log deletion for audit
        console.log(`Geofence soft-deleted: ${geofence.name} by system (no auth required)`)

        res.json({
            success: true,
            message: 'Geofence deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting geofence:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete geofence'
        })
    }
}

export const getConnectedDevices = async (req, res) => {
    try {
        const devices = await Device.find({
            status: { $in: ['active', 'low_battery'] }
        })
        .populate('touristId', 'name phone')
        .lean()

        const clientsInfo = getConnectedClientsInfo()

        res.json({
            success: true,
            data: {
                devices,
                realtimeConnections: clientsInfo,
                count: devices.length
            }
        })

    } catch (error) {
        console.error('Error getting connected devices:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve connected devices'
        })
    }
}

export const getTouristsByLocation = async (req, res) => {
    try {
        const { latitude, longitude, radius = 1000 } = req.query

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            })
        }

        const tourists = await Tourist.find({
            currentLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            },
            isActive: true
        }).lean()

        const formattedTourists = tourists.map(tourist => ({
            id: tourist._id,
            name: tourist.name,
            phone: tourist.phone,
            nationality: tourist.nationality,
            status: tourist.status,
            location: tourist.currentLocation ? {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0]
            } : null,
            lastUpdate: tourist.lastLocationUpdate
        }))

        res.json({
            success: true,
            data: {
                tourists: formattedTourists,
                count: formattedTourists.length,
                searchLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                radius: parseInt(radius)
            }
        })

    } catch (error) {
        console.error('Error getting nearby tourists:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve nearby tourists'
        })
    }
}

export const getUserLocationHistory = async (req, res) => {
    try {
        const { touristId } = req.params;
        const {
            startDate,
            endDate,
            limit = 1000,
            offset = 0,
            source,
            format = 'json'
        } = req.query;

        // Input validation
        const limitNum = Math.min(parseInt(limit) || 1000, 10000); // Max 10k records
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        // Validate tourist exists
        const tourist = await Tourist.findById(touristId);
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            });
        }

        // Build time filter
        let timeFilter = { touristId };
        
        if (startDate || endDate) {
            timeFilter.timestamp = {};
            
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid startDate format. Use YYYY-MM-DD format.'
                    });
                }
                timeFilter.timestamp.$gte = start;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid endDate format. Use YYYY-MM-DD format.'
                    });
                }
                // Set to end of day
                end.setHours(23, 59, 59, 999);
                timeFilter.timestamp.$lte = end;
            }
        }

        // Add source filter if specified
        if (source && ['gps', 'network', 'manual', 'iot_device', 'emergency'].includes(source)) {
            timeFilter.source = source;
        }

        // Get total count for pagination info
        const totalRecords = await LocationHistory.countDocuments(timeFilter);

        // Fetch location records with pagination
        const locations = await LocationHistory.find(timeFilter)
            .sort({ timestamp: -1 })
            .skip(offsetNum)
            .limit(limitNum)
            .lean();

        // Format response based on requested format
        let responseData;
        
        switch (format) {
            case 'geojson':
                responseData = {
                    type: 'FeatureCollection',
                    features: locations.map(loc => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: loc.location.coordinates
                        },
                        properties: {
                            id: loc._id,
                            timestamp: loc.timestamp,
                            accuracy: loc.accuracy,
                            speed: loc.speed,
                            heading: loc.heading,
                            altitude: loc.altitude,
                            batteryLevel: loc.batteryLevel,
                            source: loc.source,
                            networkInfo: loc.networkInfo,
                            context: loc.context
                        }
                    })),
                    metadata: {
                        touristId: touristId,
                        touristName: tourist.personalInfo?.name || 'Unknown',
                        totalRecords,
                        returnedRecords: locations.length,
                        timeRange: {
                            startDate: timeFilter.timestamp?.$gte || null,
                            endDate: timeFilter.timestamp?.$lte || null
                        }
                    }
                };
                break;

            case 'csv':
                // For CSV format, return CSV data
                const csvHeader = 'id,latitude,longitude,accuracy,speed,heading,altitude,batteryLevel,timestamp,source\n';
                const csvData = locations.map(loc => 
                    `${loc._id},${loc.location.coordinates[1]},${loc.location.coordinates[0]},${loc.accuracy || ''},${loc.speed || ''},${loc.heading || ''},${loc.altitude || ''},${loc.batteryLevel || ''},${loc.timestamp},${loc.source}`
                ).join('\n');
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="location_history_${touristId}.csv"`);
                return res.send(csvHeader + csvData);

            default: // json
                const formattedLocations = locations.map(loc => ({
                    id: loc._id,
                    latitude: loc.location.coordinates[1],
                    longitude: loc.location.coordinates[0],
                    accuracy: loc.accuracy,
                    speed: loc.speed,
                    heading: loc.heading,
                    altitude: loc.altitude,
                    batteryLevel: loc.batteryLevel,
                    timestamp: loc.timestamp,
                    source: loc.source,
                    networkInfo: loc.networkInfo,
                    context: loc.context
                }));

                responseData = {
                    touristId: touristId,
                    touristName: tourist.personalInfo?.name || 'Unknown',
                    totalRecords,
                    returnedRecords: locations.length,
                    pagination: {
                        limit: limitNum,
                        offset: offsetNum,
                        hasMore: (offsetNum + locations.length) < totalRecords,
                        nextOffset: totalRecords > (offsetNum + limitNum) ? offsetNum + limitNum : null
                    },
                    timeRange: {
                        startDate: timeFilter.timestamp?.$gte || null,
                        endDate: timeFilter.timestamp?.$lte || null
                    },
                    filters: {
                        source: source || null
                    },
                    locations: formattedLocations
                };
                break;
        }

        res.status(200).json({
            success: true,
            message: 'Location history retrieved successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Error getting user location history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

export const getMyLocationHistory = async (req, res) => {
    try {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Find tourist profile for authenticated user
        const tourist = await Tourist.findOne({ firebaseUid: req.user.uid });
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist profile not found. Please complete your profile setup.'
            });
        }

        // Use the existing getUserLocationHistory function by setting touristId in params
        req.params.touristId = tourist._id.toString();
        
        // Call the main function
        return await getUserLocationHistory(req, res);

    } catch (error) {
        console.error('Error getting my location history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get all tourists with their latest locations
 * @route GET /api/tracking/tourists/all
 */
export const getAllTouristsWithLocations = async (req, res) => {
    try {
        // Get all tourists with their basic information
        const tourists = await Tourist.find({})
            .select('digitalId firebaseUid personalInfo createdAt currentLocation lastLocationUpdate isActive status')
            .lean();

        if (!tourists || tourists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No tourists found'
            });
        }

        // Format the response data
        const formattedTourists = tourists.map(tourist => ({
            id: tourist._id,
            firebaseUid: tourist.firebaseUid,
            digitalId: tourist.digitalId,
            name: tourist.personalInfo?.name || 'Unknown',
            email: tourist.personalInfo?.email,
            phone: tourist.personalInfo?.phone,
            nationality: tourist.personalInfo?.nationality,
            profilePhoto: tourist.personalInfo?.profilePicture,
            currentLocation: tourist.currentLocation && tourist.currentLocation.coordinates ? {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0],
                lastUpdate: tourist.lastLocationUpdate
            } : null,
            isActive: tourist.isActive,
            status: tourist.status,
            createdAt: tourist.createdAt
        }));

        res.status(200).json({
            success: true,
            message: 'All tourists retrieved successfully',
            data: {
                tourists: formattedTourists,
                count: formattedTourists.length
            }
        });

    } catch (error) {
        console.error('Error getting all tourists with locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourists',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get all tourists current locations (simplified version with just location data)
 * @route GET /api/tracking/locations/all
 */
export const getAllTouristCurrentLocations = async (req, res) => {
    try {
        // Get all tourists with current location data
        const tourists = await Tourist.find({
            currentLocation: { $exists: true, $ne: null },
            'currentLocation.coordinates': { $exists: true }
        })
        .select('_id digitalId personalInfo.name currentLocation lastLocationUpdate isActive status')
        .lean();

        if (!tourists || tourists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No tourists with current locations found'
            });
        }

        // Format the response data to include tourist ID and location
        const touristLocations = tourists.map(tourist => ({
            touristId: tourist._id,
            digitalId: tourist.digitalId,
            name: tourist.personalInfo?.name || 'Unknown',
            currentLocation: {
                latitude: tourist.currentLocation.coordinates[1],
                longitude: tourist.currentLocation.coordinates[0],
                lastUpdate: tourist.lastLocationUpdate
            },
            isActive: tourist.isActive,
            status: tourist.status
        }));

        res.status(200).json({
            success: true,
            message: 'All tourist current locations retrieved successfully',
            data: {
                locations: touristLocations,
                count: touristLocations.length,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Error getting all tourist current locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourist current locations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get configuration data for frontend including API keys and settings
 * @route GET /api/tracking/config
 */
export const getTrackingConfig = async (req, res) => {
    try {
        const config = {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
                defaultCenter: {
                    lat: 20.5937,
                    lng: 78.9629 // Center of India
                },
                defaultZoom: 6
            },
            tracking: {
                refreshInterval: 30000, // 30 seconds
                maxLocationAge: 300000, // 5 minutes
                showOfflineTourists: true
            },
            alerts: {
                showEmergencyAlerts: true,
                autoRefresh: true,
                soundEnabled: false
            },
            api: {
                baseUrl: process.env.API_BASE_URL || `http://${req.get('host')}`,
                endpoints: {
                    touristLocations: '/api/tracking/locations/all',
                    touristDetails: '/api/tracking/location/current',
                    emergencyAlerts: '/api/tracking/alerts/active',
                    heatmapData: '/api/tracking/location/heatmap'
                }
            }
        };

        res.status(200).json({
            success: true,
            message: 'Tracking configuration retrieved successfully',
            data: config
        });

    } catch (error) {
        console.error('Error getting tracking config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tracking configuration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get tourists who have been inactive for more than 10 minutes
 */
export const getInactiveUsers = async (req, res) => {
    try {
        console.log('🔍 Getting inactive users (>10 minutes)...');
        
        const inactiveUsers = await inactivityService.getLongInactiveTourists();
        
        res.json({
            success: true,
            data: {
                inactiveUsers,
                totalCount: inactiveUsers.length,
                threshold: '10 minutes',
                message: `Found ${inactiveUsers.length} users inactive for more than 10 minutes`
            }
        });
        
    } catch (error) {
        console.error('Error getting inactive users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inactive users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};