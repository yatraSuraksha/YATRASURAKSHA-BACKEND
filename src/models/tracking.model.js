import mongoose from 'mongoose';

const locationHistorySchema = new mongoose.Schema({
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        index: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    accuracy: {
        type: Number,
        default: 10
    },
    speed: {
        type: Number,
        default: 0
    },
    altitude: Number,
    heading: Number,
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    source: {
        type: String,
        // enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'],
        default: 'gps'
    },
    networkInfo: {
        provider: String,
        signalStrength: Number,
        connectionType: {
            type: String,
            enum: ['wifi', '4g', '3g', '2g', 'satellite']
        }
    },
    context: {
        activity: {
            type: String,
            enum: ['stationary', 'walking', 'running', 'driving', 'cycling', 'unknown']
        },
        confidence: Number,
        weather: String,
        temperature: Number
    }
}, {
    timestamps: false,
    collection: 'location_history'
});

locationHistorySchema.index({ location: '2dsphere' });
locationHistorySchema.index({ touristId: 1, timestamp: -1 });
locationHistorySchema.index({ timestamp: 1 });
locationHistorySchema.index({ source: 1, timestamp: -1 });
locationHistorySchema.pre('save', async function(next) {
    try {
        const Tourist = mongoose.model('Tourist');
        const tourist = await Tourist.findById(this.touristId);
        if (!tourist) {
            const error = new Error(`Tourist with ID ${this.touristId} does not exist`);
            error.name = 'ValidationError';
            return next(error);
        }
        next();
    } catch (error) {
        next(error);
    }
});
locationHistorySchema.pre('save', function(next) {
    const [longitude, latitude] = this.location.coordinates;
    
    if (latitude < -90 || latitude > 90) {
        const error = new Error('Latitude must be between -90 and 90 degrees');
        error.name = 'ValidationError';
        return next(error);
    }
    
    if (longitude < -180 || longitude > 180) {
        const error = new Error('Longitude must be between -180 and 180 degrees');
        error.name = 'ValidationError';
        return next(error);
    }
    
    next();
});

const alertSchema = new mongoose.Schema({
    alertId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical', 'emergency'],
        required: true,
        index: true
    },
    message: {
        english: {
            type: String,
            required: true
        },
        hindi: String,
        local: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number]
    },
    geoFenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GeoFence'
    },
    metadata: {
        triggeredBy: String,
        thresholdValue: Number,
        actualValue: Number,
        duration: Number,
        relatedIncidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Incident'
        }
    },
    acknowledgment: {
        isAcknowledged: {
            type: Boolean,
            default: false,
            index: true
        },
        acknowledgedBy: {
            type: String
        },
        acknowledgedAt: Date,
        response: String
    },
    notifications: {
        sent: [{
            recipient: String,
            type: {
                type: String,
                enum: ['tourist', 'emergency_contact', 'authority', 'family']
            },
            method: {
                type: String,
                enum: ['push', 'sms', 'email', 'call']
            },
            timestamp: Date,
            status: {
                type: String,
                enum: ['sent', 'delivered', 'read', 'failed']
            }
        }]
    },
    autoResolve: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    resolvedBy: String
}, {
    timestamps: true,
    collection: 'alerts'
});

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ type: 1, severity: 1, 'acknowledgment.isAcknowledged': 1 });
alertSchema.index({ touristId: 1, createdAt: -1 });
alertSchema.index({ createdAt: -1 });
alertSchema.pre('save', async function(next) {
    try {
        const Tourist = mongoose.model('Tourist');
        const tourist = await Tourist.findById(this.touristId);
        if (!tourist) {
            const error = new Error(`Tourist with ID ${this.touristId} does not exist`);
            error.name = 'ValidationError';
            return next(error);
        }
        next();
    } catch (error) {
        next(error);
    }
});
alertSchema.pre('save', function(next) {
    if (this.location && this.location.coordinates) {
        const [longitude, latitude] = this.location.coordinates;
        
        if (latitude < -90 || latitude > 90) {
            const error = new Error('Alert latitude must be between -90 and 90 degrees');
            error.name = 'ValidationError';
            return next(error);
        }
        
        if (longitude < -180 || longitude > 180) {
            const error = new Error('Alert longitude must be between -180 and 180 degrees');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    
    next();
});

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        index: true
    },
    type: {
        type: String,
        enum: ['smartphone', 'smart_band', 'iot_tag', 'emergency_beacon', 'gps_tracker'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'low_battery', 'offline', 'malfunction'],
        default: 'active',
        index: true
    },
    specifications: {
        manufacturer: String,
        model: String,
        firmwareVersion: String,
        batteryCapacity: Number,
        features: [String],
        waterproof: Boolean,
        operatingTemperature: {
            min: Number,
            max: Number
        }
    },
    currentMetrics: {
        batteryLevel: {
            type: Number,
            min: 0,
            max: 100
        },
        signalStrength: Number,
        lastPing: Date,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        },
        temperature: Number,
        isCharging: Boolean
    },
    configuration: {
        pingInterval: {
            type: Number,
            default: 300
        },
        lowBatteryThreshold: {
            type: Number,
            default: 20
        },
        emergencyMode: {
            type: Boolean,
            default: false
        },
        sosButtonEnabled: {
            type: Boolean,
            default: true
        }
    },
    assignmentHistory: [{
        touristId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tourist'
        },
        assignedAt: Date,
        unassignedAt: Date,
        reason: String
    }]
}, {
    timestamps: true,
    collection: 'devices'
});

deviceSchema.index({ touristId: 1, status: 1 });
deviceSchema.index({ type: 1, status: 1 });
deviceSchema.index({ 'currentMetrics.lastPing': 1 });
deviceSchema.pre('save', async function(next) {
    try {
        if (this.touristId) {
            const Tourist = mongoose.model('Tourist');
            const tourist = await Tourist.findById(this.touristId);
            if (!tourist) {
                const error = new Error(`Tourist with ID ${this.touristId} does not exist`);
                error.name = 'ValidationError';
                return next(error);
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});
deviceSchema.pre('save', function(next) {
    if (this.currentMetrics && this.currentMetrics.batteryLevel !== undefined) {
        const battery = this.currentMetrics.batteryLevel;
        if (battery < 0 || battery > 100) {
            const error = new Error('Battery level must be between 0 and 100');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

export const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);
export const Alert = mongoose.model('Alert', alertSchema);
export const Device = mongoose.model('Device', deviceSchema);