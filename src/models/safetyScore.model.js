import mongoose from 'mongoose';

/**
 * Safety Score Schema
 * Stores pre-computed safety scores for cities/locations in India
 * Data imported from AI model's city_safety_details.csv
 */
const safetyScoreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    district: {
        type: String,
        index: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    population: {
        type: Number,
        default: 0
    },
    populationDensity: {
        type: Number,
        default: 0
    },
    crimeRate: {
        type: Number,
        default: 0
    },
    safetyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        index: true
    },
    safetyRank: {
        type: Number,
        index: true
    },
    riskLevel: {
        type: String,
        enum: ['Low Risk', 'Moderate Risk', 'Medium Risk', 'High Risk', 'Extreme Risk'],
        index: true
    }
}, {
    timestamps: true,
    collection: 'safety_scores'
});

// Geospatial index for location queries
safetyScoreSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
safetyScoreSchema.index({ state: 1, safetyScore: -1 });
safetyScoreSchema.index({ riskLevel: 1, safetyScore: -1 });

// Static method to find nearest safe locations
safetyScoreSchema.statics.findNearby = async function(longitude, latitude, maxDistanceMeters = 50000, limit = 10) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistanceMeters
            }
        }
    }).limit(limit);
};

// Static method to get safety for coordinates
safetyScoreSchema.statics.getSafetyForLocation = async function(longitude, latitude) {
    const nearby = await this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: 100000 // 100km max
            }
        }
    }).limit(1);
    
    return nearby[0] || null;
};

const SafetyScore = mongoose.model('SafetyScore', safetyScoreSchema);

export default SafetyScore;
