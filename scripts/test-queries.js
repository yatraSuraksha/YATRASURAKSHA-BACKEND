import Tourist from '../src/models/tourist.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testExistingQueries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test the exact queries that should work
        const uid1 = "xFQtS4KQ1mUuIFrrkaQz9idrSa13";
        const uid2 = "9YDUGTv0B5Pm3oQL9qkR2ebXvn73";
        
        console.log(`\n🔍 Testing query for uid1: "${uid1}"`);
        const result1 = await Tourist.findOne({ firebaseUid: uid1 });
        console.log(`Result:`, result1 ? {
            _id: result1._id,
            firebaseUid: result1.firebaseUid,
            email: result1.personalInfo?.email
        } : 'null');
        
        console.log(`\n🔍 Testing query for uid2: "${uid2}"`);
        const result2 = await Tourist.findOne({ firebaseUid: uid2 });
        console.log(`Result:`, result2 ? {
            _id: result2._id,
            firebaseUid: result2.firebaseUid,
            email: result2.personalInfo?.email
        } : 'null');

        // Test if there are any hidden characters or encoding issues
        console.log(`\n🔍 Checking all firebaseUid values in database:`);
        const allProfiles = await Tourist.find({}).select('_id firebaseUid personalInfo.email');
        for (const profile of allProfiles) {
            console.log(`   ${profile._id}`);
            console.log(`      firebaseUid: "${profile.firebaseUid}" (length: ${profile.firebaseUid?.length})`);
            console.log(`      email: ${profile.personalInfo?.email}`);
            console.log(`      bytes: [${Buffer.from(profile.firebaseUid || '').toString('hex')}]`);
        }

        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

testExistingQueries();