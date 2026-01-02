import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
    incidentId: {
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
    digitalId: {
        type: String,
        ref: 'DigitalId',
        index: true
    },
    blockchainDID: {
        type: String,
        index: true,
        sparse: true
    },
    blockchainTransactionId: {
        type: String,
        index: true,
        sparse: true
    },
    blockchainLoggedAt: {
        type: Date
    },
    type: {
        type: String,
        enum: ['panic_button', 'anomaly_detected', 'missing_person', 'medical_emergency', 'geofence_violation', 'device_malfunction', 'weather_alert', 'manual_report'],
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['open', 'investigating', 'responding', 'resolved', 'closed', 'false_alarm'],
        default: 'open',
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
        },
        address: String,
        landmark: String,
        accuracy: Number
    },
    description: {
        type: String,
        required: true
    },
    emergencyDetails: {
        panicButtonPressed: {
            type: Boolean,
            default: false
        },
        automaticDetection: {
            type: Boolean,
            default: false
        },
        reportedBy: {
            type: String,
            enum: ['tourist', 'family', 'public', 'authority', 'system']
        },
        witnesses: [String],
        involvedPersons: [String]
    },
    response: {
        evirNumber: String, 
        assignedOfficer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondingUnits: [{
            unitType: {
                type: String,
                enum: ['police', 'medical', 'fire', 'rescue', 'forest']
            },
            unitId: String,
            officerName: String,
            contactNumber: String,
            dispatchTime: Date,
            arrivalTime: Date,
            status: {
                type: String,
                enum: ['dispatched', 'en_route', 'on_scene', 'completed']
            }
        }],
        estimatedResponseTime: Number,
        actualResponseTime: Number
    },
    timeline: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        action: {
            type: String,
            required: true
        },
        performedBy: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        },
        notes: String,
        evidenceUrls: [String]
    }],
    evidence: {
        photos: [String],
        videos: [String],
        audioRecordings: [String],
        documents: [String],
        locationTrail: [{
            coordinates: [Number],
            timestamp: Date,
            source: String
        }]
    },
    notifications: {
        emergencyContactsNotified: {
            type: Boolean,
            default: false
        },
        familyNotified: {
            type: Boolean,
            default: false
        },
        authoritiesNotified: {
            type: Boolean,
            default: false
        },
        publicAlertIssued: {
            type: Boolean,
            default: false
        },
        notificationsSent: [{
            recipient: String,
            method: {
                type: String,
                enum: ['sms', 'email', 'push', 'call']
            },
            timestamp: Date,
            status: {
                type: String,
                enum: ['sent', 'delivered', 'failed']
            }
        }]
    },
    resolution: {
        resolvedAt: Date,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolutionType: {
            type: String,
            enum: ['tourist_found_safe', 'medical_assistance_provided', 'false_alarm', 'referred_to_authorities', 'ongoing_investigation']
        },
        resolutionNotes: String,
        followUpRequired: {
            type: Boolean,
            default: false
        },
        followUpDate: Date
    },
    analytics: {
        detectionMethod: String,
        responseEfficiency: Number,
        outcomeRating: Number,
        lessonsLearned: [String],
        improvementSuggestions: [String]
    }
}, {
    timestamps: true,
    collection: 'incidents'
});

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ type: 1, severity: 1, status: 1 });
incidentSchema.index({ touristId: 1, createdAt: -1 });
incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ 'response.assignedOfficer': 1 });

incidentSchema.methods.getResponseTime = function() {
    if (this.response.actualResponseTime) {
        return this.response.actualResponseTime;
    }
    const dispatch = this.timeline.find(t => t.action === 'dispatched');
    const arrival = this.timeline.find(t => t.action === 'arrived_on_scene');
    if (dispatch && arrival) {
        return Math.round((arrival.timestamp - dispatch.timestamp) / (1000 * 60));
    }
    return null;
};

incidentSchema.methods.addTimelineEvent = function(action, performedBy, notes = '', coordinates = null) {
    this.timeline.push({
        action,
        performedBy,
        notes,
        location: coordinates ? { coordinates } : undefined
    });
    return this.save();
};

export default mongoose.model('Incident', incidentSchema);