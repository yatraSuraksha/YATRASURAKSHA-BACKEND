import axios from 'axios';

/**
 * Blockchain HTTP Client Service
 * Communicates with remote blockchain VPS via HTTP API
 */
class BlockchainClientService {
    constructor() {
        this.baseURL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3003/api/blockchain';
        this.timeout = 10000; // 10 seconds
        this.enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BLOCKCHAIN_API_KEY || 'default-key'}`
            }
        });

        console.log(`🔗 Blockchain Client initialized - Enabled: ${this.enabled}, URL: ${this.baseURL}`);
    }

    /**
     * Check if blockchain service is available
     */
    async isAvailable() {
        if (!this.enabled) return false;
        
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.warn('⚠️ Blockchain service unavailable:', error.message);
            return false;
        }
    }

    /**
     * Create tourist blockchain ID
     */
    async createTouristID(touristData) {
        if (!this.enabled) {
            console.log('🔍 Blockchain disabled - returning mock DID');
            return `did:mock:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        try {
            const response = await this.client.post('/tourist/create', {
                personalInfo: touristData.personalInfo,
                digitalId: touristData.digitalId,
                checkInTime: touristData.checkInTime,
                expectedCheckOutTime: touristData.expectedCheckOutTime
            });

            if (response.data.success) {
                console.log('✅ Tourist blockchain ID created:', response.data.blockchainDID);
                return response.data.blockchainDID;
            } else {
                throw new Error(response.data.message || 'Failed to create blockchain ID');
            }
        } catch (error) {
            console.warn('⚠️ Failed to create blockchain tourist ID:', error.message);
            // Return mock DID as fallback
            return `did:fallback:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    /**
     * Log location update to blockchain
     */
    async logLocationUpdate(locationData) {
        if (!this.enabled) return { success: false, reason: 'blockchain_disabled' };

        try {
            const response = await this.client.post('/location/log', locationData);
            
            if (response.data.success) {
                console.log('🔗 Location update logged to blockchain');
                return { success: true, txId: response.data.txId };
            } else {
                throw new Error(response.data.message || 'Failed to log location');
            }
        } catch (error) {
            console.warn('⚠️ Failed to log location to blockchain:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log incident/emergency alert to blockchain
     */
    async logIncident(incidentData) {
        if (!this.enabled) return { success: false, reason: 'blockchain_disabled' };

        try {
            const response = await this.client.post('/incident/log', incidentData);
            
            if (response.data.success) {
                console.log('🔗 Incident logged to blockchain');
                return { success: true, txId: response.data.txId };
            } else {
                throw new Error(response.data.message || 'Failed to log incident');
            }
        } catch (error) {
            console.warn('⚠️ Failed to log incident to blockchain:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update tourist status on blockchain
     */
    async updateTouristStatus(did, newStatus) {
        if (!this.enabled) return { success: false, reason: 'blockchain_disabled' };

        try {
            const response = await this.client.put(`/tourist/${did}/status`, { status: newStatus });
            
            if (response.data.success) {
                console.log('🔗 Tourist status updated on blockchain');
                return { success: true, txId: response.data.txId };
            } else {
                throw new Error(response.data.message || 'Failed to update status');
            }
        } catch (error) {
            console.warn('⚠️ Failed to update tourist status on blockchain:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Query tourist data from blockchain
     */
    async queryTourist(did) {
        if (!this.enabled) return null;

        try {
            const response = await this.client.get(`/tourist/${did}`);
            
            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Tourist not found');
            }
        } catch (error) {
            console.warn('⚠️ Failed to query tourist from blockchain:', error.message);
            return null;
        }
    }

    /**
     * Get blockchain health status
     */
    async getHealthStatus() {
        if (!this.enabled) {
            return {
                status: 'disabled',
                message: 'Blockchain integration is disabled',
                enabled: false
            };
        }

        try {
            const response = await this.client.get('/health');
            return {
                status: 'healthy',
                message: 'Blockchain service is running',
                enabled: true,
                data: response.data
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: error.message,
                enabled: true,
                error: error.message
            };
        }
    }

    /**
     * Get audit trail for a tourist
     */
    async getAuditTrail(touristId) {
        if (!this.enabled) return [];

        try {
            const response = await this.client.get(`/audit/${touristId}`);
            
            if (response.data.success) {
                return response.data.data || [];
            } else {
                throw new Error(response.data.message || 'Failed to get audit trail');
            }
        } catch (error) {
            console.warn('⚠️ Failed to get audit trail from blockchain:', error.message);
            return [];
        }
    }

    /**
     * Verify blockchain record
     */
    async verifyRecord(did) {
        if (!this.enabled) return { verified: false, reason: 'blockchain_disabled' };

        try {
            const response = await this.client.post(`/verify/${did}`);
            
            if (response.data.success) {
                return {
                    verified: true,
                    data: response.data.data
                };
            } else {
                throw new Error(response.data.message || 'Verification failed');
            }
        } catch (error) {
            console.warn('⚠️ Failed to verify blockchain record:', error.message);
            return { verified: false, error: error.message };
        }
    }
}

// Export singleton instance
const blockchainClientService = new BlockchainClientService();
export default blockchainClientService;