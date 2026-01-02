import mongoose from 'mongoose';

/**
 * Family Group Schema
 * Manages family groups for location sharing and tracking
 */
const familyGroupSchema = new mongoose.Schema({
    groupId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    // Group settings
    settings: {
        allowMemberInvites: {
            type: Boolean,
            default: false
        },
        requireApprovalToJoin: {
            type: Boolean,
            default: true
        },
        shareLocationByDefault: {
            type: Boolean,
            default: true
        },
        notifyOnEmergency: {
            type: Boolean,
            default: true
        },
        notifyOnGeofenceAlert: {
            type: Boolean,
            default: true
        },
        notifyOnLowBattery: {
            type: Boolean,
            default: false
        },
        notifyOnInactivity: {
            type: Boolean,
            default: true
        },
        inactivityThresholdMinutes: {
            type: Number,
            default: 30,
            min: 5,
            max: 1440 // 24 hours
        }
    },
    // Group status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    // Invite code for joining
    inviteCode: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    inviteCodeExpiresAt: {
        type: Date
    },
    // Statistics
    stats: {
        totalMembers: {
            type: Number,
            default: 1
        },
        activeMembers: {
            type: Number,
            default: 1
        },
        totalAlerts: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    collection: 'family_groups'
});

/**
 * Family Member Schema
 * Tracks individual members within family groups
 */
const familyMemberSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['admin', 'guardian', 'member', 'child'],
        default: 'member'
    },
    nickname: {
        type: String,
        trim: true,
        maxlength: 50
    },
    relationship: {
        type: String,
        enum: ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'relative', 'friend', 'other'],
        default: 'other'
    },
    // Member-specific settings
    settings: {
        shareLocation: {
            type: Boolean,
            default: true
        },
        receiveAlerts: {
            type: Boolean,
            default: true
        },
        canViewOthersLocation: {
            type: Boolean,
            default: true
        },
        isEmergencyContact: {
            type: Boolean,
            default: false
        }
    },
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'removed'],
        default: 'active',
        index: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastLocationShared: {
        type: Date
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist'
    }
}, {
    timestamps: true,
    collection: 'family_members'
});

/**
 * Family Invite Schema
 * Manages pending invitations to family groups
 */
const familyInviteSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true
    },
    // Invite can be sent via email, phone, or in-app
    inviteType: {
        type: String,
        enum: ['email', 'phone', 'link', 'in_app'],
        required: true
    },
    inviteTarget: {
        type: String, // email address, phone number, or touristId
        required: true,
        index: true
    },
    // For in-app invites
    targetTouristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        index: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['admin', 'guardian', 'member', 'child'],
        default: 'member'
    },
    relationship: {
        type: String,
        enum: ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'relative', 'friend', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
        default: 'pending',
        index: true
    },
    inviteCode: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
        // TTL index defined via schema.index() below
    },
    respondedAt: {
        type: Date
    },
    message: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    collection: 'family_invites'
});

/**
 * Family Location Share Log Schema
 * Tracks location sharing history within family groups
 */
const familyLocationLogSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
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
    accuracy: Number,
    batteryLevel: Number,
    timestamp: {
        type: Date,
        default: Date.now
        // Index defined via schema.index() below
    },
    // Who viewed this location
    viewedBy: [{
        touristId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tourist'
        },
        viewedAt: Date
    }]
}, {
    timestamps: false,
    collection: 'family_location_logs'
});

/**
 * Family Alert Schema
 * Tracks alerts shared within family groups
 */
const familyAlertSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    alertId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true
    },
    alertType: {
        type: String,
        enum: ['emergency', 'sos', 'geofence_exit', 'geofence_entry', 'low_battery', 'inactivity', 'check_in', 'custom'],
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    message: {
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
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'expired'],
        default: 'active',
        index: true
    },
    acknowledgedBy: [{
        touristId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tourist'
        },
        acknowledgedAt: Date,
        response: String
    }],
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist'
    },
    resolvedAt: Date,
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    collection: 'family_alerts'
});

// Indexes
familyGroupSchema.index({ createdBy: 1, isActive: 1 });
familyGroupSchema.index({ inviteCode: 1, inviteCodeExpiresAt: 1 });

familyMemberSchema.index({ groupId: 1, touristId: 1 }, { unique: true });
familyMemberSchema.index({ touristId: 1, status: 1 });

familyInviteSchema.index({ groupId: 1, status: 1 });
familyInviteSchema.index({ inviteTarget: 1, status: 1 });
familyInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

familyLocationLogSchema.index({ groupId: 1, timestamp: -1 });
familyLocationLogSchema.index({ touristId: 1, timestamp: -1 });
familyLocationLogSchema.index({ location: '2dsphere' });
familyLocationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 * 7 }); // Keep for 7 days

familyAlertSchema.index({ groupId: 1, status: 1, createdAt: -1 });
familyAlertSchema.index({ triggeredBy: 1, createdAt: -1 });

// Static methods for FamilyGroup
familyGroupSchema.statics.generateGroupId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `FG-${timestamp}-${random}`.toUpperCase();
};

familyGroupSchema.statics.generateInviteCode = function() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Instance methods
familyGroupSchema.methods.refreshInviteCode = async function(expiryHours = 24) {
    this.inviteCode = this.constructor.generateInviteCode();
    this.inviteCodeExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return this.save();
};

familyMemberSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

familyMemberSchema.methods.canInvite = function() {
    return this.role === 'admin' || this.role === 'guardian';
};

// Pre-save hooks
familyGroupSchema.pre('save', function(next) {
    if (this.isNew && !this.groupId) {
        this.groupId = this.constructor.generateGroupId();
    }
    next();
});

familyInviteSchema.pre('save', function(next) {
    if (this.isNew && !this.inviteCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 12; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.inviteCode = code;
    }
    next();
});

familyAlertSchema.pre('save', function(next) {
    if (this.isNew && !this.alertId) {
        this.alertId = `FA-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    }
    next();
});

// Export models
export const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
export const FamilyMember = mongoose.model('FamilyMember', familyMemberSchema);
export const FamilyInvite = mongoose.model('FamilyInvite', familyInviteSchema);
export const FamilyLocationLog = mongoose.model('FamilyLocationLog', familyLocationLogSchema);
export const FamilyAlert = mongoose.model('FamilyAlert', familyAlertSchema);

export default {
    FamilyGroup,
    FamilyMember,
    FamilyInvite,
    FamilyLocationLog,
    FamilyAlert
};
