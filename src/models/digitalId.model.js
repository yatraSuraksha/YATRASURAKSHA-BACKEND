import mongoose from 'mongoose';

const digitalIdSchema = new mongoose.Schema({
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    blockchainHash: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    qrCode: {
        type: String,
        required: true
    },
    kycData: {
        verified: {
            type: Boolean,
            default: false
        },
        documents: [{
            type: {
                type: String,
                enum: ['aadhaar', 'passport', 'visa', 'driving_license', 'photo'],
                required: true
            },
            documentNumber: String,
            fileUrl: String,
            verificationStatus: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending'
            },
            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            verificationDate: Date,
            expiryDate: Date
        }],
        verificationDate: Date,
        verificationScore: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    issueDetails: {
        issuedAt: {
            type: Date,
            default: Date.now
        },
        issuedBy: {
            type: String,
            required: true
        },
        issueLocation: {
            type: String,
            required: true
        },
        issueCoordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    validity: {
        validFrom: {
            type: Date,
            required: true,
            default: Date.now
        },
        validUntil: {
            type: Date,
            required: true
        },
        extendedUntil: Date,
        autoExpiry: {
            type: Boolean,
            default: true
        }
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'suspended'],
        default: 'active',
        index: true
    },
    blockchain: {
        transactionHash: String,
        blockNumber: Number,
        networkId: String,
        gasUsed: Number,
        smartContractAddress: String
    },
    accessLog: [{
        accessedBy: String,
        accessType: {
            type: String,
            enum: ['view', 'verify', 'update', 'scan']
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        userAgent: String
    }],
    permissions: {
        canTrack: {
            type: Boolean,
            default: true
        },
        canShareEmergency: {
            type: Boolean,
            default: true
        },
        canAccessMedical: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    collection: 'digital_ids'
});

digitalIdSchema.index({ blockchainHash: 1 });
digitalIdSchema.index({ touristId: 1 });
digitalIdSchema.index({ status: 1, 'validity.validUntil': 1 });
digitalIdSchema.index({ 'issueDetails.issuedAt': 1 });

digitalIdSchema.methods.isValid = function() {
    const now = new Date();
    return this.status === 'active' && 
           this.validity.validUntil > now && 
           this.validity.validFrom <= now;
};

digitalIdSchema.methods.getRemainingDays = function() {
    const now = new Date();
    const validUntil = this.validity.extendedUntil || this.validity.validUntil;
    return Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24));
};

export default mongoose.model('DigitalId', digitalIdSchema);