import cron from 'node-cron';
import Tourist from '../models/tourist.model.js';

/**
 * Service to monitor tourist activity and update status based on location updates
 */
class InactivityService {
    constructor() {
        this.INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.LONG_INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.isRunning = false;
    }

    /**
     * Check for inactive tourists and update their status
     */
    async checkInactiveTourists() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - this.INACTIVITY_THRESHOLD);
            
            console.log(`[InactivityService] Checking for tourists inactive since: ${fiveMinutesAgo.toISOString()}`);

            // Find tourists who:
            // 1. Currently have 'active' status
            // 2. Haven't updated location in the last 5 minutes
            // 3. Are not in emergency status (don't change emergency status)
            const inactiveTourists = await Tourist.find({
                status: 'active',
                $or: [
                    { 'currentLocation.timestamp': { $lt: fiveMinutesAgo } },
                    { 'currentLocation.timestamp': { $exists: false } }
                ]
            }).select('digitalId personalInfo.name currentLocation.timestamp status');

            if (inactiveTourists.length === 0) {
                console.log('[InactivityService] No inactive tourists found');
                return { updated: 0, tourists: [] };
            }

            console.log(`[InactivityService] Found ${inactiveTourists.length} inactive tourists`);

            // Update their status to 'inactive'
            const updateResult = await Tourist.updateMany(
                {
                    status: 'active',
                    $or: [
                        { 'currentLocation.timestamp': { $lt: fiveMinutesAgo } },
                        { 'currentLocation.timestamp': { $exists: false } }
                    ]
                },
                {
                    $set: {
                        status: 'inactive',
                        statusUpdatedAt: new Date(),
                        statusReason: 'No location update for 5+ minutes'
                    }
                }
            );

            console.log(`[InactivityService] Updated ${updateResult.modifiedCount} tourists to inactive status`);

            // Log the tourists that were updated
            const updatedTouristNames = inactiveTourists.map(t => 
                `${t.personalInfo.name} (${t.digitalId})`
            ).join(', ');

            if (updatedTouristNames) {
                console.log(`[InactivityService] Updated tourists: ${updatedTouristNames}`);
            }

            return {
                updated: updateResult.modifiedCount,
                tourists: inactiveTourists.map(t => ({
                    digitalId: t.digitalId,
                    name: t.personalInfo.name,
                    lastLocationUpdate: t.currentLocation?.timestamp
                }))
            };

        } catch (error) {
            console.error('[InactivityService] Error checking inactive tourists:', error);
            return { updated: 0, tourists: [], error: error.message };
        }
    }

    /**
     * Reactivate tourists when they send location updates
     */
    async reactivateTourist(touristId) {
        try {
            const result = await Tourist.updateOne(
                { 
                    $or: [
                        { digitalId: touristId },
                        { firebaseUid: touristId },
                        { _id: touristId }
                    ],
                    status: 'inactive'
                },
                {
                    $set: {
                        status: 'active',
                        statusUpdatedAt: new Date(),
                        statusReason: 'Location update received'
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[InactivityService] Reactivated tourist: ${touristId}`);
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('[InactivityService] Error reactivating tourist:', error);
            return false;
        }
    }

    /**
     * Get tourists who have been inactive for more than 10 minutes
     */
    async getLongInactiveTourists() {
        try {
            const tenMinutesAgo = new Date(Date.now() - this.LONG_INACTIVITY_THRESHOLD);
            
            console.log(`[InactivityService] Getting tourists inactive since: ${tenMinutesAgo.toISOString()}`);

            // Find tourists who haven't updated location in the last 10 minutes
            const longInactiveTourists = await Tourist.find({
                $and: [
                    {
                        $or: [
                            { 'currentLocation.timestamp': { $lt: tenMinutesAgo } },
                            { 'currentLocation.timestamp': { $exists: false } }
                        ]
                    },
                    {
                        status: { $ne: 'emergency' } // Don't include emergency status users
                    }
                ]
            })
            .select('digitalId personalInfo.name personalInfo.phone currentLocation status statusUpdatedAt createdAt')
            .sort({ 'currentLocation.timestamp': 1 }); // Oldest first

            const result = longInactiveTourists.map(tourist => ({
                id: tourist._id,
                digitalId: tourist.digitalId,
                name: tourist.personalInfo.name,
                phone: tourist.personalInfo.phone,
                status: tourist.status,
                lastLocationUpdate: tourist.currentLocation?.timestamp,
                coordinates: tourist.currentLocation ? [
                    tourist.currentLocation.coordinates[0], // longitude
                    tourist.currentLocation.coordinates[1]  // latitude
                ] : null,
                inactiveDuration: tourist.currentLocation?.timestamp ? 
                    Math.floor((Date.now() - new Date(tourist.currentLocation.timestamp).getTime()) / (60 * 1000)) : 
                    null,
                statusUpdatedAt: tourist.statusUpdatedAt,
                registeredAt: tourist.createdAt
            }));

            console.log(`[InactivityService] Found ${result.length} tourists inactive for >10 minutes`);
            
            return result;

        } catch (error) {
            console.error('[InactivityService] Error getting long inactive tourists:', error);
            return [];
        }
    }

    /**
     * Start the periodic inactivity checker
     */
    startMonitoring() {
        if (this.isRunning) {
            console.log('[InactivityService] Already running');
            return;
        }

        // Run every 2 minutes to check for inactive users
        this.cronJob = cron.schedule('*/2 * * * *', async () => {
            await this.checkInactiveTourists();
        }, {
            scheduled: false,
            timezone: "UTC"
        });

        this.cronJob.start();
        this.isRunning = true;
        
        console.log('[InactivityService] Started monitoring - checking every 2 minutes for tourists inactive >5 minutes');

        // Run initial check
        setTimeout(() => {
            this.checkInactiveTourists();
        }, 5000); // Wait 5 seconds after startup
    }

    /**
     * Stop the periodic inactivity checker
     */
    stopMonitoring() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob.destroy();
            this.isRunning = false;
            console.log('[InactivityService] Stopped monitoring');
        }
    }

    /**
     * Get current service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            inactivityThreshold: this.INACTIVITY_THRESHOLD,
            thresholdMinutes: this.INACTIVITY_THRESHOLD / (60 * 1000),
            longInactivityThreshold: this.LONG_INACTIVITY_THRESHOLD,
            longThresholdMinutes: this.LONG_INACTIVITY_THRESHOLD / (60 * 1000)
        };
    }
}

// Export singleton instance
const inactivityService = new InactivityService();
export default inactivityService;