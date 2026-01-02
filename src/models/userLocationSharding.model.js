
import mongoose from 'mongoose';
import crypto from 'crypto';

class UserBasedLocationSharding {
    constructor() {
        this.shardingStrategy = 'user_hash'; 
        this.shardsCount = 64; 
        this.models = new Map();
    }

    getUserCollectionName(touristId) {
        switch (this.shardingStrategy) {
            case 'user_individual':
                
                return `location_history_user_${touristId}`;
            
            case 'user_hash':
                
                const hash = crypto.createHash('md5').update(touristId.toString()).digest('hex');
                const shardId = parseInt(hash.substring(0, 2), 16) % this.shardsCount;
                return `location_history_shard_${shardId}`;
            
            case 'user_region':
                
                return `location_history_region_${this.getUserRegion(touristId)}`;
            
            default:
                return `location_history_shard_0`;
        }
    }

    getUserModel(touristId) {
        const collectionName = this.getUserCollectionName(touristId);
        
        if (!this.models.has(collectionName)) {
            const model = mongoose.model(
                `LocationHistory_${collectionName}`, 
                locationHistoryBaseSchema, 
                collectionName
            );
            this.models.set(collectionName, model);
        }
        
        return this.models.get(collectionName);
    }

    async saveLocationRecord(locationData) {
        const Model = this.getUserModel(locationData.touristId);
        const record = new Model(locationData);
        return await record.save();
    }

    async queryUserLocationHistory(touristId, options = {}) {
        const Model = this.getUserModel(touristId);
        
        const {
            startTime = new Date(Date.now() - 24 * 60 * 60 * 1000),
            endTime = new Date(),
            limit = 100,
            sort = { timestamp: -1 }
        } = options;

        return await Model.find({
            touristId,
            timestamp: { $gte: startTime, $lte: endTime }
        })
        .sort(sort)
        .limit(limit)
        .lean();
    }

    async deleteUserData(touristId) {
        const Model = this.getUserModel(touristId);
        
        if (this.shardingStrategy === 'user_individual') {
            
            await Model.collection.drop();
        } else {
            
            await Model.deleteMany({ touristId });
        }
    }

    getUserRegion(touristId) {
        
        
        return 'default';
    }
}

export const userLocationSharding = new UserBasedLocationSharding();