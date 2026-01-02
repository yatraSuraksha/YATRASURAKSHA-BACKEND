import Tourist from '../src/models/tourist.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkProblematicProfiles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check for profiles with null or undefined firebaseUid
        const nullUidProfiles = await Tourist.find({
            $or: [
                { firebaseUid: null },
                { firebaseUid: undefined },
                { firebaseUid: "" },
                { firebaseUid: { $exists: false } }
            ]
        });

        console.log(`\n🔍 Profiles with null/empty firebaseUid: ${nullUidProfiles.length}`);
        for (const profile of nullUidProfiles) {
            console.log(`   ${profile._id} - firebaseUid: "${profile.firebaseUid}" - email: ${profile.personalInfo?.email}`);
        }

        // Check all profiles
        const allProfiles = await Tourist.find({}).select('_id firebaseUid personalInfo.email');
        console.log(`\n📊 Total profiles in database: ${allProfiles.length}`);
        for (const profile of allProfiles) {
            console.log(`   ${profile._id} - firebaseUid: "${profile.firebaseUid}" - email: ${profile.personalInfo?.email}`);
        }

        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

checkProblematicProfiles();