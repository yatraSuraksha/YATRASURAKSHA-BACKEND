import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    // Unique video identifier (UUID from filename)
    videoId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // File information
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    extension: {
        type: String,
        required: true
    },
    
    // Owner information - linked to Tourist
    uploadedBy: {
        type: String,
        required: true,
        index: true  // Index for fast lookup by user
    },
    uploaderName: {
        type: String,
        default: 'Unknown'
    },
    uploaderEmail: {
        type: String,
        default: null
    },
    
    // Optional metadata
    title: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    tags: [{
        type: String
    }],
    
    // Location where video was recorded (optional)
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            default: undefined
        },
        address: String
    },
    
    // Video status
    status: {
        type: String,
        enum: ['processing', 'ready', 'failed', 'deleted'],
        default: 'ready'
    },
    
    // Timestamps
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    
    // Soft delete support
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes for efficient queries
videoSchema.index({ uploadedBy: 1, isDeleted: 1 });
videoSchema.index({ uploadedAt: -1 });
videoSchema.index({ status: 1 });

// Add 2dsphere index for location-based queries (only if coordinates exist)
videoSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

// Virtual for formatted file size
videoSchema.virtual('sizeFormatted').get(function() {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for stream path
videoSchema.virtual('streamPath').get(function() {
    return `/api/videos/stream/${this.filename}`;
});

// Virtual for download path
videoSchema.virtual('downloadPath').get(function() {
    return `/api/videos/download/${this.filename}`;
});

// Ensure virtuals are included in JSON
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

// Static method to find videos by user
videoSchema.statics.findByUser = function(userId, options = {}) {
    const { page = 1, limit = 20, includeDeleted = false } = options;
    const query = { uploadedBy: userId };
    
    if (!includeDeleted) {
        query.isDeleted = false;
    }
    
    return this.find(query)
        .sort({ uploadedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

// Static method to count videos by user
videoSchema.statics.countByUser = function(userId, includeDeleted = false) {
    const query = { uploadedBy: userId };
    if (!includeDeleted) {
        query.isDeleted = false;
    }
    return this.countDocuments(query);
};

// Static method to find all active videos
videoSchema.statics.findAllActive = function(options = {}) {
    const { page = 1, limit = 50 } = options;
    return this.find({ isDeleted: false, status: 'ready' })
        .sort({ uploadedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

// Instance method to soft delete
videoSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

const Video = mongoose.model('Video', videoSchema);

export default Video;
