import Tourist from '../models/tourist.model.js';
import { v4 as uuidv4 } from 'uuid';
import blockchainClientService from '../services/blockchain-client.service.js';

const createAutomaticTouristProfile = async (firebaseUser) => {
    try {
        const { uid, email, name, picture, emailVerified } = firebaseUser;
        
        console.log(`🔍 Searching for firebaseUid: "${uid}"`);
        
        const existingTourist = await Tourist.findOne({ firebaseUid: uid });
        
        console.log(`🔍 Query result:`, existingTourist ? {
            _id: existingTourist._id,
            firebaseUid: existingTourist.firebaseUid,
            email: existingTourist.personalInfo?.email
        } : 'null');
        
        if (existingTourist) {
            console.log(`✅ Returning existing profile: ${existingTourist._id}`);
            return existingTourist;
        }

        console.log(`❌ No profile found, should create new one for uid: "${uid}"`);
        
        const timestamp = Date.now();
        const uidPrefix = uid.substring(0, 8).toUpperCase();
        const digitalId = `YATRA-${timestamp}-${uidPrefix}`;
        
        const defaultStayDuration = 30 * 24 * 60 * 60 * 1000;
        const expectedCheckOut = new Date(Date.now() + defaultStayDuration);
        
                // Generate blockchain DID
        let blockchainDID = null;
        try {
            blockchainDID = await blockchainClientService.createTouristID({
                digitalId: touristId,
                personalInfo: {
                    name: name || 'User',
                    email: email,
                    nationality: 'Unknown',
                    phone: 'Not provided'
                },
                checkInTime: new Date(),
                expectedCheckOutTime: expectedCheckOut
            });
            console.log(`🔗 Blockchain DID issued: ${blockchainDID}`);
        } catch (blockchainError) {
            console.warn('⚠️ Failed to create blockchain DID, proceeding without it:', blockchainError.message);
        }
        
        const touristProfile = new Tourist({
            digitalId,
            blockchainDID, // Store the blockchain DID
            firebaseUid: uid,
            personalInfo: {
                name: name || 'User',
                email: email,
                profilePicture: picture || null
            },
            // Note: currentLocation omitted - will be set when first location update is received
            safetyScore: 75,
            status: 'active',
            profileCompletionStage: 'initial', 
            checkInTime: new Date(),
            expectedCheckOutTime: expectedCheckOut,
            emergencyContacts: [], 
            travelItinerary: [], 
            preferences: {
                language: 'english',
                notifications: {
                    push: true,
                    sms: false, 
                    email: emailVerified || false
                },
                trackingEnabled: true,
                shareLocationWithFamily: false
            },
            devices: [], 
            kycStatus: 'pending',
            riskProfile: {
                travelExperience: 'beginner', 
                medicalConditions: [],
                specialNeeds: [],
                previousIncidents: 0
            }
        });

        // Add debugging to see what's happening
        console.log(`🔄 About to save tourist profile for user: ${uid}`);
        console.log(`🔄 Profile data before save:`, {
            digitalId,
            firebaseUid: uid,
            email: email
        });
        
        const savedProfile = await touristProfile.save();
        
        console.log(`✅ Save operation completed`);
        console.log(`✅ Returned profile ID: ${savedProfile._id}`);
        console.log(`✅ Profile saved successfully: ${savedProfile.digitalId}`);
        
        // Issue digital ID on blockchain
        try {
            const blockchainDID = await blockchainClientService.createTouristID({
                touristId: savedProfile._id.toString(),
                personalInfo: savedProfile.personalInfo,
                expiryDate: savedProfile.expectedCheckOutTime,
                documentType: 'TOURIST_PROFILE'
            });
            
            // Update profile with blockchain DID
            savedProfile.blockchainDID = blockchainDID;
            await savedProfile.save();
            
            console.log(`✅ Blockchain DID issued: ${blockchainDID}`);
        } catch (blockchainError) {
            console.warn('⚠️ Failed to issue blockchain DID:', blockchainError.message);
            // Continue without blockchain - system should work offline too
        }
        
        // CRITICAL: Verify the profile actually exists in database
        const verifyProfile = await Tourist.findById(savedProfile._id);
        if (verifyProfile) {
            console.log(`✅ VERIFIED: Profile found in database: ${verifyProfile._id}`);
        } else {
            console.log(`❌ CRITICAL ERROR: Profile NOT found in database after save!`);
            console.log(`❌ Saved ID: ${savedProfile._id} does not exist in DB`);
        }
        
        return savedProfile;
        
    } catch (error) {
        console.error('❌ Error creating automatic tourist profile:', error);
        throw error;
    }
};

export const verifyToken = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No valid token provided or token verification failed.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;
        if (!uid || !email) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token data. Missing required user information.',
                error: 'INVALID_TOKEN_DATA'
            });
        }
        let touristProfile = null;
        try {
            touristProfile = await createAutomaticTouristProfile(req.user);
            console.log(`🔍 Tourist profile returned:`, {
                id: touristProfile?._id,
                digitalId: touristProfile?.digitalId,
                firebaseUid: touristProfile?.firebaseUid
            });
        } catch (touristError) {
            console.error('Error creating tourist profile:', touristError);
            
        }

        res.status(200).json({
            success: true,
            message: 'Token verified successfully',
            data: {
                user: {
                    uid,
                    email,
                    name: name || 'Unknown User',
                    picture: picture || null,
                    emailVerified: emailVerified || false,
                    tokenValid: true,
                    touristProfile: touristProfile ? {
                        id: touristProfile._id,
                        digitalId: touristProfile.digitalId,
                        status: touristProfile.status,
                        stage: touristProfile.profileCompletionStage,
                        safetyScore: touristProfile.safetyScore,
                        kycStatus: touristProfile.kycStatus,
                        hasPhone: !!(touristProfile.personalInfo.phone),
                        hasNationality: !!(touristProfile.personalInfo.nationality),
                        hasEmergencyContact: touristProfile.emergencyContacts.length > 0,
                        profileComplete: touristProfile.profileCompletionStage === 'complete',
                        readyForTracking: touristProfile.profileCompletionStage !== 'initial'
                    } : null
                }
            }
        });
    } catch (error) {
        console.error('Error in verifyToken:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during token verification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};
export const getCurrentUser = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No user data found. Please authenticate first.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;
        
        console.log(`🚨 getCurrentUser called with Firebase UID: "${uid}"`);
        console.log(`🚨 User email: "${email}"`);
        console.log(`🚨 Known UIDs in database: "xFQtS4KQ1mUuIFrrkaQz9idrSa13", "9YDUGTv0B5Pm3oQL9qkR2ebXvn73"`);
        
        let touristProfile = null;
        try {
            touristProfile = await createAutomaticTouristProfile(req.user);
            console.log(`🔍 getCurrentUser - Tourist profile returned:`, {
                id: touristProfile?._id,
                digitalId: touristProfile?.digitalId,
                firebaseUid: touristProfile?.firebaseUid
            });
        } catch (touristError) {
            console.error('Error fetching/creating tourist profile:', touristError);
        }

        res.status(200).json({
            success: true,
            message: 'User info retrieved from token',
            data: {
                user: {
                    uid,
                    email,
                    name,
                    picture,
                    emailVerified,
                    source: 'firebase_token',
                    touristProfile: touristProfile ? {
                        id: touristProfile._id,
                        digitalId: touristProfile.digitalId,
                        status: touristProfile.status,
                        stage: touristProfile.profileCompletionStage,
                        safetyScore: touristProfile.safetyScore,
                        kycStatus: touristProfile.kycStatus,
                        checkInTime: touristProfile.checkInTime,
                        expectedCheckOutTime: touristProfile.expectedCheckOutTime,
                        hasPhone: !!(touristProfile.personalInfo.phone),
                        hasNationality: !!(touristProfile.personalInfo.nationality),
                        profileComplete: touristProfile.profileCompletionStage === 'complete',
                        locationTracking: touristProfile.preferences.trackingEnabled,
                        emergencyContactsCount: touristProfile.emergencyContacts.length,
                        itineraryCount: touristProfile.travelItinerary.length
                    } : null
                }
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const getTouristProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }

        // Get existing profile from database - DON'T create or update
        const touristProfile = await Tourist.findOne({ firebaseUid: req.user.uid });

        if (!touristProfile) {
            return res.status(404).json({
                success: false,
                message: 'Tourist profile not found',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tourist profile retrieved successfully',
            data: {
                profile: touristProfile
            }
        });
    } catch (error) {
        console.error('Error getting tourist profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourist profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

export const updateTouristProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }
        // Get existing profile from database - DON'T create or override
        let touristProfile = await Tourist.findOne({ firebaseUid: req.user.uid });
        
        if (!touristProfile) {
            return res.status(404).json({
                success: false,
                message: 'Tourist profile not found',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        const allowedUpdates = ['personalInfo', 'emergencyContacts', 'preferences', 'travelItinerary', 'riskProfile'];
        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        if (req.body.personalInfo) {
            // Merge existing personalInfo with updates - ALLOW name to be updated
            updates.personalInfo = {
                ...touristProfile.personalInfo.toObject(),
                ...req.body.personalInfo
                // Removed the override lines - now name and other fields can be updated
            };
        }
        const hasPhone = updates.personalInfo?.phone || touristProfile.personalInfo.phone;
        const hasNationality = updates.personalInfo?.nationality || touristProfile.personalInfo.nationality;
        const hasEmergencyContact = (updates.emergencyContacts && updates.emergencyContacts.length > 0) || 
                                   touristProfile.emergencyContacts.length > 0;
        
        
        let newStage = touristProfile.profileCompletionStage;
        if (hasPhone && hasNationality && hasEmergencyContact) {
            newStage = 'complete';
        } else if (hasPhone && hasNationality) {
            newStage = 'basic';
        } else if (hasPhone || hasNationality) {
            newStage = 'basic';
        }
        
        
        const stageOrder = ['initial', 'basic', 'complete', 'verified'];
        const currentIndex = stageOrder.indexOf(touristProfile.profileCompletionStage);
        const newIndex = stageOrder.indexOf(newStage);
        
        if (newIndex > currentIndex) {
            updates.profileCompletionStage = newStage;
        }
        const updatedProfile = await Tourist.findByIdAndUpdate(
            touristProfile._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Log profile update to blockchain
        if (updatedProfile.blockchainDID) {
            // Fire and forget - don't block the response
            blockchainClientService.logIncident({
                touristDID: updatedProfile.blockchainDID,
                touristId: updatedProfile.digitalId,
                incidentType: 'profile_update',
                severity: 'info',
                description: `Profile updated - fields: ${Object.keys(updates).join(', ')}`,
                metadata: {
                    updatedFields: Object.keys(updates),
                    personalInfo: updatedProfile.personalInfo,
                    updatedBy: req.user?.uid || 'system'
                }
            }).then(result => {
                if (result.success) {
                    console.log('🔗 Profile update logged to blockchain');
                }
            }).catch(error => {
                console.warn('⚠️ Failed to log profile update to blockchain:', error.message);
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tourist profile updated successfully',
            data: {
                profile: updatedProfile,
                updatedFields: Object.keys(updates)
            }
        });
    } catch (error) {
        console.error('Error updating tourist profile:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update tourist profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

export const getProfileStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
        }

        const touristProfile = await createAutomaticTouristProfile(req.user);
        
        
        const profileChecks = {
            'personalInfo.phone': {
                isComplete: !!(touristProfile.personalInfo.phone && 
                              touristProfile.personalInfo.phone.length >= 10),
                priority: 'high',
                description: 'Valid phone number for emergency contact'
            },
            'personalInfo.nationality': {
                isComplete: !!(touristProfile.personalInfo.nationality && 
                              touristProfile.personalInfo.nationality.length >= 2),
                priority: 'high', 
                description: 'Nationality for consular assistance'
            },
            'personalInfo.dateOfBirth': {
                isComplete: !!touristProfile.personalInfo.dateOfBirth,
                priority: 'medium',
                description: 'Date of birth for age-appropriate safety recommendations'
            },
            'emergencyContacts': {
                isComplete: touristProfile.emergencyContacts.length > 0,
                priority: 'critical',
                description: 'At least one emergency contact'
            },
            'currentLocation': {
                isComplete: touristProfile.currentLocation.coordinates[0] !== 77.2090 || 
                           touristProfile.currentLocation.coordinates[1] !== 28.6139,
                priority: 'medium',
                description: 'Current location for safety monitoring'
            }
        };

        const missingFields = Object.entries(profileChecks)
            .filter(([_, check]) => !check.isComplete)
            .map(([field, check]) => ({
                field,
                priority: check.priority,
                description: check.description
            }));

        const completedFields = Object.values(profileChecks).filter(check => check.isComplete).length;
        const totalFields = Object.keys(profileChecks).length;
        const completionPercentage = Math.round((completedFields / totalFields) * 100);
        let recommendedStage = 'initial';
        if (completionPercentage >= 80) {
            recommendedStage = 'complete';
        } else if (completionPercentage >= 50) {
            recommendedStage = 'basic';
        }
        const stageUpgradeNeeded = touristProfile.profileCompletionStage === 'initial' && recommendedStage !== 'initial';

        res.status(200).json({
            success: true,
            message: 'Profile status retrieved successfully',
            data: {
                profileId: touristProfile._id,
                digitalId: touristProfile.digitalId,
                currentStage: touristProfile.profileCompletionStage,
                recommendedStage,
                stageUpgradeAvailable: stageUpgradeNeeded,
                completionPercentage,
                isComplete: missingFields.length === 0,
                profileChecks,
                missingFields,
                priorityActions: missingFields
                    .filter(field => field.priority === 'critical')
                    .map(field => field.description),
                recommendations: {
                    immediate: missingFields.filter(f => f.priority === 'critical'),
                    important: missingFields.filter(f => f.priority === 'high'),
                    optional: missingFields.filter(f => f.priority === 'medium')
                },
                kycStatus: touristProfile.kycStatus,
                safetyScore: touristProfile.safetyScore,
                accountStatus: {
                    canUseTracking: completionPercentage >= 25,
                    canReceiveAlerts: touristProfile.emergencyContacts.length > 0,
                    canShareLocation: touristProfile.personalInfo.phone !== undefined,
                    requiresImmediateAction: missingFields.some(f => f.priority === 'critical')
                }
            }
        });
    } catch (error) {
        console.error('Error getting profile status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

// Admin-only routes (no authentication required)
export const getAllTourists = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, search } = req.query;
        const skip = (page - 1) * limit;
        
        // Build query filters
        const query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { 'personalInfo.name': { $regex: search, $options: 'i' } },
                { 'personalInfo.email': { $regex: search, $options: 'i' } },
                { digitalId: { $regex: search, $options: 'i' } }
            ];
        }

        const tourists = await Tourist.find(query)
            .select('-devices -travelItinerary -preferences')
            .sort({ checkInTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Tourist.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Tourists retrieved successfully',
            data: {
                tourists,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting all tourists:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourists',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

export const getTouristById = async (req, res) => {
    try {
        const { touristId } = req.params;
        
        const tourist = await Tourist.findById(touristId);
        
        if (!tourist) {
            return res.status(404).json({
                success: false,
                message: 'Tourist not found',
                error: 'TOURIST_NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tourist retrieved successfully',
            data: {
                tourist
            }
        });
    } catch (error) {
        console.error('Error getting tourist by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tourist',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};


