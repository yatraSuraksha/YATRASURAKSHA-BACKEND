
import mongoose from 'mongoose';
const locationHistoryBaseSchema = new mongoose.Schema({
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
        enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'],
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
    timestamps: false
    
});
locationHistoryBaseSchema.index({ location: '2dsphere' });
locationHistoryBaseSchema.index({ touristId: 1, timestamp: -1 });
locationHistoryBaseSchema.index({ timestamp: 1 });
locationHistoryBaseSchema.index({ source: 1, timestamp: -1 });
locationHistoryBaseSchema.index({ touristId: 1, source: 1, timestamp: -1 }); 

class LocationHistoryShardManager {
    constructor() {
        this.shardingStrategy = 'monthly'; 
        this.models = new Map(); 
        this.retentionPolicy = {
            hot: 30, 
            warm: 180, 
            cold: 365 * 2, 
            archive: 365 * 7 
        };
    }

    getCollectionName(timestamp = new Date()) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (this.shardingStrategy) {
            case 'daily':
                return `location_history_${year}_${month}_${day}`;
            case 'weekly':
                const weekNumber = this.getWeekNumber(date);
                return `location_history_${year}_w${weekNumber}`;
            case 'monthly':
                return `location_history_${year}_${month}`;
            default:
                return `location_history_${year}_${month}`;
        }
    }

    getModel(timestamp = new Date()) {
        const collectionName = this.getCollectionName(timestamp);
        
        if (!this.models.has(collectionName)) {
            
            const model = mongoose.model(collectionName, locationHistoryBaseSchema, collectionName);
            this.models.set(collectionName, model);
            
            
            this.ensureCollectionOptimization(model);
        }
        
        return this.models.get(collectionName);
    }

    async saveLocationRecord(locationData) {
        const timestamp = locationData.timestamp || new Date();
        const Model = this.getModel(timestamp);
        
        const record = new Model(locationData);
        return await record.save();
    }

    async queryLocationHistory(touristId, options = {}) {
        const {
            startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), 
            endTime = new Date(),
            limit = 100,
            sort = { timestamp: -1 }
        } = options;
        const collections = this.getCollectionsForTimeRange(startTime, endTime);
        
        
        const promises = collections.map(async (collectionName) => {
            const Model = this.models.get(collectionName) || this.getModel(startTime);
            
            try {
                return await Model.find({
                    touristId,
                    timestamp: { $gte: startTime, $lte: endTime }
                })
                .sort(sort)
                .limit(limit)
                .lean();
            } catch (error) {
                
                console.warn(`Collection ${collectionName} not found:`, error.message);
                return [];
            }
        });
        const results = await Promise.all(promises);
        const combined = results.flat();
        
        
        combined.sort((a, b) => {
            if (sort.timestamp === -1) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        return combined.slice(0, limit);
    }

    getCollectionsForTimeRange(startTime, endTime) {
        const collections = [];
        const current = new Date(startTime);
        
        while (current <= endTime) {
            collections.push(this.getCollectionName(current));
            
            
            switch (this.shardingStrategy) {
                case 'daily':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'weekly':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + 1);
                    break;
            }
        }
        
        return [...new Set(collections)]; 
    }

    async ensureCollectionOptimization(Model) {
        try {
            
            await Model.createCollection();
            
            
            await Model.ensureIndexes();
            
            
            if (this.retentionPolicy.archive) {
                await Model.collection.createIndex(
                    { timestamp: 1 },
                    { 
                        expireAfterSeconds: this.retentionPolicy.archive * 24 * 60 * 60,
                        name: 'ttl_timestamp'
                    }
                );
            }
            
            console.log(`Collection ${Model.collection.name} optimized successfully`);
        } catch (error) {
            console.error(`Error optimizing collection ${Model.collection.name}:`, error);
        }
    }

    async archiveOldData() {
        
        
        console.log('Archiving old location data...');
    }

    getWeekNumber(date) {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startDate.getDay() + 1) / 7);
    }

    async performMaintenance() {
        console.log('Performing location history maintenance...');
        
        
        await this.archiveOldData();
        
        
        await this.cleanupExpiredCollections();
        
        
        await this.optimizeIndexes();
    }

    async cleanupExpiredCollections() {
        
        console.log('Cleaning up expired collections...');
    }

    async optimizeIndexes() {
        
        console.log('Optimizing indexes...');
    }
}
export const locationShardManager = new LocationHistoryShardManager();
export { locationHistoryBaseSchema };
export const LocationHistory = mongoose.model('LocationHistory', locationHistoryBaseSchema, 'location_history');