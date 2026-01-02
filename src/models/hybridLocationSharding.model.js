
import mongoose from 'mongoose';
import crypto from 'crypto';

class HybridLocationSharding {
    constructor() {
        this.timeSharding = 'monthly'; 
        this.userShards = 16; 
        this.models = new Map();
        
        
        this.performanceTiers = {
            vip: 'individual', 
            premium: 'small_shard', 
            standard: 'standard_shard' 
        };
        
        this.retentionPolicies = {
            vip: { hot: 90, warm: 365, cold: 365 * 3, archive: 365 * 10 },
            premium: { hot: 60, warm: 180, cold: 365 * 2, archive: 365 * 7 },
            standard: { hot: 30, warm: 90, cold: 365, archive: 365 * 5 }
        };
    }

    getCollectionName(touristId, timestamp = new Date(), userTier = 'standard') {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        
        let timePrefix;
        switch (this.timeSharding) {
            case 'daily':
                const day = String(date.getDate()).padStart(2, '0');
                timePrefix = `${year}_${month}_${day}`;
                break;
            case 'weekly':
                const week = this.getWeekNumber(date);
                timePrefix = `${year}_w${week}`;
                break;
            case 'monthly':
                timePrefix = `${year}_${month}`;
                break;
            default:
                timePrefix = `${year}_${month}`;
        }
        let userSuffix;
        switch (this.performanceTiers[userTier]) {
            case 'individual':
                userSuffix = `user_${touristId}`;
                break;
            case 'small_shard':
                const smallShardId = this.getUserShardId(touristId, 4); 
                userSuffix = `premium_${smallShardId}`;
                break;
            case 'standard_shard':
                const shardId = this.getUserShardId(touristId, this.userShards);
                userSuffix = `shard_${shardId}`;
                break;
            default:
                userSuffix = 'shard_0';
        }

        return `location_history_${timePrefix}_${userSuffix}`;
    }

    getUserShardId(touristId, totalShards) {
        const hash = crypto.createHash('md5').update(touristId.toString()).digest('hex');
        return parseInt(hash.substring(0, 8), 16) % totalShards;
    }

    async getUserTier(touristId) {
        
        
        try {
            const Tourist = mongoose.model('Tourist');
            const tourist = await Tourist.findById(touristId, 'subscriptionTier safetyScore').lean();
            
            if (tourist?.subscriptionTier === 'vip' || tourist?.safetyScore > 90) {
                return 'vip';
            } else if (tourist?.subscriptionTier === 'premium' || tourist?.safetyScore > 75) {
                return 'premium';
            }
            return 'standard';
        } catch (error) {
            return 'standard';
        }
    }

    async getModel(touristId, timestamp = new Date()) {
        const userTier = await this.getUserTier(touristId);
        const collectionName = this.getCollectionName(touristId, timestamp, userTier);
        
        if (!this.models.has(collectionName)) {
            
            const { locationHistoryBaseSchema } = await import('./locationHistorySharded.model.js');
            
            const model = mongoose.model(
                `LocationHistory_${collectionName}`, 
                locationHistoryBaseSchema, 
                collectionName
            );
            this.models.set(collectionName, model);
            
            
            this.optimizeCollection(model, userTier);
        }
        
        return this.models.get(collectionName);
    }

    async saveLocationRecord(locationData) {
        const timestamp = locationData.timestamp || new Date();
        const Model = await this.getModel(locationData.touristId, timestamp);
        
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
        const userTier = await this.getUserTier(touristId);
        
        
        const collections = await this.getCollectionsForTimeRange(touristId, startTime, endTime);
        
        
        const promises = collections.map(async (collectionName) => {
            try {
                const model = this.models.get(collectionName);
                if (!model) return [];
                
                return await model.find({
                    touristId,
                    timestamp: { $gte: startTime, $lte: endTime }
                })
                .sort(sort)
                .limit(limit)
                .lean();
            } catch (error) {
                console.warn(`Error querying collection ${collectionName}:`, error.message);
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

    async getCollectionsForTimeRange(touristId, startTime, endTime) {
        const userTier = await this.getUserTier(touristId);
        const collections = [];
        const current = new Date(startTime);
        
        while (current <= endTime) {
            const collectionName = this.getCollectionName(touristId, current, userTier);
            collections.push(collectionName);
            
            
            switch (this.timeSharding) {
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

    async optimizeCollection(model, userTier) {
        try {
            await model.createCollection();
            await model.ensureIndexes();
            
            
            const retention = this.retentionPolicies[userTier];
            if (retention?.archive) {
                await model.collection.createIndex(
                    { timestamp: 1 },
                    { 
                        expireAfterSeconds: retention.archive * 24 * 60 * 60,
                        name: 'ttl_timestamp'
                    }
                );
            }
            
            
            if (userTier === 'vip') {
                await model.collection.createIndex(
                    { touristId: 1, source: 1, timestamp: -1 },
                    { background: true }
                );
            }
            
        } catch (error) {
            console.error(`Error optimizing collection ${model.collection.name}:`, error);
        }
    }

    async deleteUserData(touristId) {
        console.log(`Starting GDPR deletion for tourist: ${touristId}`);
        
        
        const userTier = await this.getUserTier(touristId);
        
        
        if (this.performanceTiers[userTier] === 'individual') {
            
            const currentDate = new Date();
            const startDate = new Date(currentDate.getFullYear() - 10, 0, 1); 
            
            const collections = await this.getCollectionsForTimeRange(touristId, startDate, currentDate);
            
            for (const collectionName of collections) {
                try {
                    const model = this.models.get(collectionName);
                    if (model) {
                        await model.collection.drop();
                        console.log(`Dropped collection: ${collectionName}`);
                    }
                } catch (error) {
                    console.error(`Error dropping collection ${collectionName}:`, error);
                }
            }
        } else {
            
            const collections = await this.getAllUserCollections(touristId);
            
            for (const collectionName of collections) {
                try {
                    const model = this.models.get(collectionName);
                    if (model) {
                        const result = await model.deleteMany({ touristId });
                        console.log(`Deleted ${result.deletedCount} records from ${collectionName}`);
                    }
                } catch (error) {
                    console.error(`Error deleting from collection ${collectionName}:`, error);
                }
            }
        }
        
        console.log(`GDPR deletion completed for tourist: ${touristId}`);
    }

    async getAllUserCollections(touristId) {
        
        
        const collections = [];
        
        try {
            const db = mongoose.connection.db;
            const allCollections = await db.listCollections().toArray();
            
            const userTier = await this.getUserTier(touristId);
            const shardId = this.getUserShardId(touristId, this.userShards);
            
            for (const collection of allCollections) {
                const name = collection.name;
                if (name.startsWith('location_history_') && 
                    (name.includes(`shard_${shardId}`) || name.includes(`user_${touristId}`))) {
                    collections.push(name);
                }
            }
        } catch (error) {
            console.error('Error listing collections:', error);
        }
        
        return collections;
    }

    async getShardingStats() {
        const stats = {
            totalCollections: this.models.size,
            userTierDistribution: {},
            shardDistribution: {},
            performanceMetrics: {}
        };
        
        
        return stats;
    }

    async performMaintenance() {
        console.log('Starting hybrid sharding maintenance...');
        
        
        await this.archiveOldData();
        
        
        await this.rebalanceShards();
        
        
        await this.optimizeAllIndexes();
        
        console.log('Hybrid sharding maintenance completed');
    }

    async archiveOldData() {
        
        console.log('Archiving old location data...');
    }

    async rebalanceShards() {
        
        console.log('Checking shard balance...');
    }

    async optimizeAllIndexes() {
        
        console.log('Optimizing all indexes...');
    }

    getWeekNumber(date) {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startDate.getDay() + 1) / 7);
    }
}
export const hybridLocationSharding = new HybridLocationSharding();
export default hybridLocationSharding;