import mongoose from 'mongoose';

const geoFenceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'],
        required: true,
        index: true
    },
    geometry: {
        type: {
            type: String,
            enum: ['Polygon', 'Point'], // Removed 'Circle' as it's not valid GeoJSON
            required: true
        },
        coordinates: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    radius: {
        type: Number,
        min: 1,
        max: 50000, // Maximum 50km radius
        validate: {
            validator: function(value) {
                // Radius is required only for Point geometry (circles)
                if (this.geometry?.type === 'Point') {
                    return value != null && value > 0;
                }
                return true;
            },
            message: 'Radius is required for circular geofences and must be greater than 0'
        }
    },
    riskLevel: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    alertMessage: {
        english: String,
        hindi: String,
        assamese: String,
        bengali: String,
        manipuri: String,
    },
    restrictions: {
        timeRestricted: {
            type: Boolean,
            default: false
        },
        allowedHours: {
            from: String,
            to: String
        },
        weatherDependent: {
            type: Boolean,
            default: false
        },
        minimumGroupSize: Number,
        requiredPermissions: [String],
        prohibitedActivities: [String]
    },
    metadata: {
        category: {
            type: String,
            enum: ['natural', 'urban', 'heritage', 'adventure', 'religious', 'commercial']
        },
        popularity: {
            type: Number,
            min: 1,
            max: 5
        },
        averageVisitDuration: Number,
        capacity: Number,
        facilities: [String],
        entryFee: Number,
        contactInfo: {
            phone: String,
            email: String,
            website: String
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: String,
        required: true,
        index: true
    },
    lastModifiedBy: {
        type: String,
        index: true
    },
    statistics: {
        totalVisitors: {
            type: Number,
            default: 0
        },
        incidentCount: {
            type: Number,
            default: 0
        },
        averageSafetyScore: Number,
        lastIncident: Date
    }
}, {
    timestamps: true,
    collection: 'geo_fences'
});

geoFenceSchema.index({ geometry: '2dsphere' });
geoFenceSchema.index({ type: 1, isActive: 1 });
geoFenceSchema.index({ riskLevel: 1 });
geoFenceSchema.index({ createdAt: 1 });

geoFenceSchema.methods.isPointInside = function(longitude, latitude) {
    return false;
};

geoFenceSchema.methods.getLocalizedMessage = function(language = 'english') {
    return this.alertMessage[language] || this.alertMessage.english || 'Alert: You are entering a monitored area.';
};

export default mongoose.model('GeoFence', geoFenceSchema);