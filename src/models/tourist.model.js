import mongoose from 'mongoose';

const touristSchema = new mongoose.Schema({
    digitalId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    blockchainDID: {
        type: String,
        index: true,
        sparse: true // Allow null values but create index for non-null values
    },
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    personalInfo: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: function() {
                
                return this.profileCompletionStage !== 'initial';
            },
            trim: true,
            validate: {
                validator: function(v) {
                    
                    if (!v) return true; 
                    return /^[+]?[\d\s\-\(\)]+$/.test(v) && v.length >= 10;
                },
                message: 'Phone number must be valid international format'
            }
        },
        nationality: {
            type: String,
            required: function() {
                
                return this.profileCompletionStage !== 'initial';
            },
            trim: true,
            validate: {
                validator: function(v) {
                    
                    if (!v) return true; 
                    return v.length >= 2 && !['unknown', 'not specified', 'n/a'].includes(v.toLowerCase());
                },
                message: 'Please provide a valid nationality'
            }
        },
        aadhaarNumber: {
            type: String,
            select: false
        },
        passportNumber: {
            type: String,
            select: false
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
        },
        profilePicture: String
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        accuracy: Number,
        address: String
    },
    safetyScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 75
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'emergency', 'missing', 'safe'],
        default: 'active',
        index: true
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    statusReason: {
        type: String,
        default: 'Initial status'
    },
    profileCompletionStage: {
        type: String,
        enum: ['initial', 'basic', 'complete', 'verified'],
        default: 'initial',
        index: true
    },
    checkInTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    expectedCheckOutTime: {
        type: Date,
        required: true
    },
    actualCheckOutTime: Date,
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        relationship: String,
        phone: {
            type: String,
            required: true
        },
        email: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    travelItinerary: [{
        destination: {
            type: String,
            required: true
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        },
        plannedArrival: Date,
        plannedDeparture: Date,
        actualArrival: Date,
        actualDeparture: Date,
        accommodationType: String,
        accommodationDetails: String,
        activities: [String],
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'extreme']
        }
    }],
    preferences: {
        language: {
            type: String,
            default: 'english'
        },
        notifications: {
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            }
        },
        trackingEnabled: {
            type: Boolean,
            default: true
        },
        shareLocationWithFamily: {
            type: Boolean,
            default: false
        }
    },
    devices: [{
        deviceId: String,
        deviceType: {
            type: String,
            enum: ['mobile', 'smart_band', 'iot_tag']
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastSeen: Date,
        batteryLevel: Number
    }],
    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    riskProfile: {
        travelExperience: {
            type: String,
            enum: ['beginner', 'intermediate', 'experienced', 'expert']
        },
        medicalConditions: [String],
        specialNeeds: [String],
        previousIncidents: Number
    }
}, {
    timestamps: true,
    collection: 'tourists'
});

touristSchema.index({ status: 1, checkInTime: 1 });
touristSchema.index({ safetyScore: 1 });
touristSchema.index({ 'currentLocation.coordinates': '2dsphere' });
touristSchema.index({ 'personalInfo.email': 1 });
touristSchema.index({ createdAt: 1 });

export default mongoose.model('Tourist', touristSchema);