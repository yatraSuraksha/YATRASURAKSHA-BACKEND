import Tourist from '../src/models/tourist.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testUpdateFields() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find the test user profile
        const firebaseUid = "xFQtS4KQ1mUuIFrrkaQz9idrSa13";
        const profile = await Tourist.findOne({ firebaseUid });
        
        if (!profile) {
            console.log('❌ Profile not found');
            return;
        }

        console.log('📋 Current Profile Data:');
        console.log('Personal Info:', {
            name: profile.personalInfo?.name,
            phone: profile.personalInfo?.phone,
            dateOfBirth: profile.personalInfo?.dateOfBirth,
            nationality: profile.personalInfo?.nationality,
            address: profile.personalInfo?.address
        });
        
        console.log('Emergency Contacts:', profile.emergencyContacts?.length || 0);
        console.log('Preferences:', {
            language: profile.preferences?.language,
            notifications: profile.preferences?.notifications
        });
        
        console.log('Profile Stage:', profile.profileCompletionStage);

        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

testUpdateFields();