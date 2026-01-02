'use strict';

const { Contract } = require('fabric-contract-api');

class DigitalTouristIdContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async issueTouristID(ctx, touristData) {
        console.info('============= START : Issue Tourist ID ===========');
        
        const touristId = JSON.parse(touristData);
        
        await ctx.stub.putState(touristId.did, Buffer.from(JSON.stringify(touristId)));
        console.info('============= END : Issue Tourist ID ===========');
        
        return JSON.stringify(touristId);
    }

    async verifyTouristID(ctx, did, verifierDID) {
        console.info('============= START : Verify Tourist ID ===========');
        
        const touristBuffer = await ctx.stub.getState(did);
        if (!touristBuffer || touristBuffer.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const tourist = JSON.parse(touristBuffer.toString());
        
        // Add verification record
        const verification = {
            verifiedBy: verifierDID,
            timestamp: new Date().toISOString(),
            status: 'verified'
        };
        
        if (!tourist.verifications) {
            tourist.verifications = [];
        }
        tourist.verifications.push(verification);
        
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(tourist)));
        
        console.info('============= END : Verify Tourist ID ===========');
        return JSON.stringify(tourist);
    }

    async updateTouristIDStatus(ctx, did, newStatus, reason) {
        console.info('============= START : Update Tourist ID Status ===========');
        
        const touristBuffer = await ctx.stub.getState(did);
        if (!touristBuffer || touristBuffer.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const tourist = JSON.parse(touristBuffer.toString());
        tourist.status = newStatus;
        tourist.statusReason = reason;
        tourist.lastUpdated = new Date().toISOString();
        
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(tourist)));
        
        console.info('============= END : Update Tourist ID Status ===========');
        return JSON.stringify(tourist);
    }

    async queryTouristID(ctx, did) {
        console.info('============= START : Query Tourist ID ===========');
        
        const touristBuffer = await ctx.stub.getState(did);
        if (!touristBuffer || touristBuffer.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        console.info('============= END : Query Tourist ID ===========');
        return touristBuffer.toString();
    }

    async verifyDocumentHash(ctx, did, providedHash) {
        console.info('============= START : Verify Document Hash ===========');
        
        const touristBuffer = await ctx.stub.getState(did);
        if (!touristBuffer || touristBuffer.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const tourist = JSON.parse(touristBuffer.toString());
        const isValid = tourist.documentHash === providedHash;
        
        console.info('============= END : Verify Document Hash ===========');
        return JSON.stringify({ valid: isValid, timestamp: new Date().toISOString() });
    }

    async getAllTourists(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
        }
        
        return JSON.stringify(allResults);
    }

}

module.exports = DigitalTouristIdContract;