import { createClerkClient, verifyToken } from '@clerk/express';
import dotenv from 'dotenv';

dotenv.config();

let clerkClient = null;

/**
 * Initialize Clerk client for token verification
 */
const initializeClerk = () => {
    try {
        if (clerkClient) {
            return clerkClient;
        }

        const secretKey = process.env.CLERK_SECRET_KEY;

        if (!secretKey) {
            console.warn('⚠️ Clerk configuration not found. Clerk authentication will be disabled.');
            console.warn('Set CLERK_SECRET_KEY in your .env file to enable Clerk auth.');
            return null;
        }

        clerkClient = createClerkClient({
            secretKey: secretKey
        });

        console.log('✅ Clerk client initialized successfully');
        return clerkClient;
    } catch (error) {
        console.error('❌ Clerk initialization error:', error.message);
        console.warn('Clerk authentication will be disabled.');
        return null;
    }
};

// Initialize on module load
const clerk = initializeClerk();

/**
 * Verify a Clerk session token
 * @param {string} token - The Clerk session token
 * @returns {Promise<object>} - Decoded token payload with user info
 */
export const verifyClerkToken = async (token) => {
    if (!clerk) {
        throw new Error('Clerk is not configured');
    }

    try {
        // Verify the session token using Clerk's verifyToken function
        // This is a standalone function, not a method on the clerk client
        const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY
        });

        // Extract user ID from the verified token
        const userId = verifiedToken.sub;

        // Get user details for additional info
        let userDetails = null;
        try {
            userDetails = await clerk.users.getUser(userId);
        } catch (userError) {
            console.warn('⚠️ Could not fetch Clerk user details:', userError.message);
        }

        return {
            uid: userId, // Clerk user ID mapped to uid for consistency
            email: userDetails?.emailAddresses?.[0]?.emailAddress || null,
            emailVerified: userDetails?.emailAddresses?.[0]?.verification?.status === 'verified',
            name: userDetails ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() : null,
            picture: userDetails?.imageUrl || null,
            clerkUser: verifiedToken,
            userDetails: userDetails
        };
    } catch (error) {
        console.error('❌ Clerk token verification failed:', error.message);
        throw error;
    }
};

export default clerk;
export const isClerkConfigured = () => clerk !== null;
