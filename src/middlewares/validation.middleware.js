import mongoose from 'mongoose';
import Tourist from '../models/tourist.model.js';
import GeoFence from '../models/geoFence.model.js';
import { LocationHistory, Alert, Device } from '../models/tracking.model.js';

export const validateObjectId = (fieldName) => {
    return (req, res, next) => {
        const id = req.params[fieldName] || req.body[fieldName];
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} is required`
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${fieldName} format`
            });
        }

        next();
    };
};

export const validateTouristExists = async (req, res, next) => {
    try {
        const touristId = req.params.touristId || req.body.touristId;
        
        if (!touristId) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID is required'
            });
        }

        const tourist = await Tourist.findById(touristId);
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            });
        }
        req.tourist = tourist;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating tourist existence',
            error: error.message
        });
    }
};

export const validateOrCreateTourist = async (req, res, next) => {
    try {
        
        if (!req.user || !req.user.uid) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to validate tourist profile'
            });
        }
        const touristId = req.params.touristId || req.body.touristId;
        
        if (touristId) {
            
            const tourist = await Tourist.findOne({ 
                _id: touristId, 
                firebaseUid: req.user.uid 
            });
            
            if (!tourist) {
                return res.status(404).json({
                    success: false,
                    message: 'Tourist profile not found or access denied'
                });
            }
            
            req.tourist = tourist;
        } else {
            
            const tourist = await Tourist.findOne({ firebaseUid: req.user.uid });
            
            if (!tourist) {
                
                return res.status(404).json({
                    success: false,
                    message: 'Tourist profile not found. Please complete profile setup.'
                });
            }
            
            req.tourist = tourist;
            
            if (!req.body.touristId && !req.params.touristId) {
                req.body.touristId = tourist._id.toString();
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating tourist profile',
            error: error.message
        });
    }
};

export const validateGeofenceExists = async (req, res, next) => {
    try {
        const fenceId = req.params.fenceId || req.body.fenceId;
        
        if (!fenceId) {
            return res.status(400).json({
                success: false,
                message: 'Geofence ID is required'
            });
        }

        const geofence = await GeoFence.findById(fenceId);
        if (!geofence) {
            return res.status(404).json({
                success: false,
                message: 'Geofence not found'
            });
        }

        req.geofence = geofence;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating geofence existence',
            error: error.message
        });
    }
};

export const validateCoordinates = (req, res, next) => {
    const { latitude, longitude } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude must be numbers'
        });
    }

    if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
            success: false,
            message: 'Latitude must be between -90 and 90 degrees'
        });
    }

    if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
            success: false,
            message: 'Longitude must be between -180 and 180 degrees'
        });
    }

    next();
};

export const validateAlertExists = async (req, res, next) => {
    try {
        const alertId = req.params.alertId || req.body.alertId;
        
        if (!alertId) {
            return res.status(400).json({
                success: false,
                message: 'Alert ID is required'
            });
        }

        const alert = await Alert.findOne({ alertId });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        req.alert = alert;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating alert existence',
            error: error.message
        });
    }
};

export const validateDeviceExists = async (req, res, next) => {
    try {
        const deviceId = req.params.deviceId || req.body.deviceId;
        
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required'
            });
        }

        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        req.device = device;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating device existence',
            error: error.message
        });
    }
};

export const sanitizeInput = (req, res, next) => {
    
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
    };

    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) {
        sanitizeObject(req.body);
    }
    
    if (req.query) {
        sanitizeObject(req.query);
    }

    next();
};

export const validatePagination = (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            success: false,
            message: 'Page must be a positive integer'
        });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be between 1 and 100'
        });
    }
    
    req.pagination = {
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum
    };
    
    next();
};

export const validateLocationHistoryParams = (req, res, next) => {
    const { limit = 1000, offset = 0 } = req.query;
    
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 10000) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be between 1 and 10000'
        });
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
            success: false,
            message: 'Offset must be a non-negative integer'
        });
    }
    
    
    const { startDate, endDate } = req.query;
    
    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Use YYYY-MM-DD format.'
            });
        }
    }
    
    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Use YYYY-MM-DD format.'
            });
        }
    }
    
    
    const { format = 'json' } = req.query;
    if (!['json', 'geojson', 'csv'].includes(format)) {
        return res.status(400).json({
            success: false,
            message: 'Format must be one of: json, geojson, csv'
        });
    }
    
    next();
};

export const cleanupOrphanedRecords = async () => {
    try {
        console.log('🧹 Starting orphaned records cleanup...');
        
        
        const orphanedLocations = await LocationHistory.aggregate([
            {
                $lookup: {
                    from: 'tourists',
                    localField: 'touristId',
                    foreignField: '_id',
                    as: 'tourist'
                }
            },
            {
                $match: {
                    tourist: { $size: 0 }
                }
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (orphanedLocations.length > 0) {
            const orphanedIds = orphanedLocations.map(doc => doc._id);
            const locationResult = await LocationHistory.deleteMany({ _id: { $in: orphanedIds } });
            console.log(`🗑️ Removed ${locationResult.deletedCount} orphaned location records`);
        }
        const orphanedAlerts = await Alert.aggregate([
            {
                $lookup: {
                    from: 'tourists',
                    localField: 'touristId',
                    foreignField: '_id',
                    as: 'tourist'
                }
            },
            {
                $match: {
                    tourist: { $size: 0 }
                }
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (orphanedAlerts.length > 0) {
            const orphanedAlertIds = orphanedAlerts.map(doc => doc._id);
            const alertResult = await Alert.deleteMany({ _id: { $in: orphanedAlertIds } });
            console.log(`🗑️ Removed ${alertResult.deletedCount} orphaned alert records`);
        }
        const orphanedDevices = await Device.aggregate([
            {
                $lookup: {
                    from: 'tourists',
                    localField: 'touristId',
                    foreignField: '_id',
                    as: 'tourist'
                }
            },
            {
                $match: {
                    tourist: { $size: 0 }
                }
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (orphanedDevices.length > 0) {
            const orphanedDeviceIds = orphanedDevices.map(doc => doc._id);
            const deviceResult = await Device.deleteMany({ _id: { $in: orphanedDeviceIds } });
            console.log(`🗑️ Removed ${deviceResult.deletedCount} orphaned device records`);
        }

        console.log('✅ Orphaned records cleanup completed');
    } catch (error) {
        console.error('❌ Error during orphaned records cleanup:', error);
    }
};

// Validate tourist exists for location updates without authentication
export const validateTouristForLocationUpdate = async (req, res, next) => {
    try {
        const touristId = req.body.touristId;
        
        if (!touristId) {
            return res.status(400).json({
                success: false,
                message: 'Tourist ID is required for location update'
            });
        }

        const tourist = await Tourist.findById(touristId);
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found'
            });
        }

        req.tourist = tourist;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error validating tourist for location update',
            error: error.message
        });
    }
};