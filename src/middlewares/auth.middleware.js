import { auth } from '../config/firebase.config.js';
import admin from 'firebase-admin';
import blockchainClientService from '../services/blockchain-client.service.js';

// Enhanced authentication middleware with blockchain verification
export const verifyFirebaseTokenWithBlockchain = async (req, res, next) => {
    try {
        
        if (!auth) {
            return res.status(503).json({
                success: false,
                message: 'Firebase authentication is not configured. Please set up Firebase credentials.'
            });
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header is required. Format: Bearer <token>'
            });
        }
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header format. Expected: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1]; 
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Valid Firebase ID token is required'
            });
        }
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Token must be a valid JWT.'
            });
        }
        
        const decodedToken = await auth.verifyIdToken(token);
        
        // Verify blockchain DID if available
        let blockchainVerification = null;
        try {
            const Tourist = (await import('../models/tourist.model.js')).default;
            const tourist = await Tourist.findOne({ firebaseUid: decodedToken.uid });
            
            if (tourist?.blockchainDID) {
                blockchainVerification = await blockchainClientService.verifyRecord(tourist.blockchainDID);
                console.log('🔗 Blockchain verification completed:', blockchainVerification.verified ? 'VALID' : 'INVALID');
            }
        } catch (blockchainError) {
            console.warn('⚠️ Blockchain verification failed:', blockchainError.message);
            // Continue without blockchain verification
        }
        
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            signInProvider: decodedToken.firebase?.sign_in_provider,
            firebaseUser: decodedToken,
            blockchainVerification // Add blockchain verification result
        };

        next();
    } catch (error) {
        console.error('🚨 Authentication error:', error.message);
        
        // Specific error handling
        let errorMessage = 'Authentication failed';
        let statusCode = 401;
        
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Token has expired. Please sign in again.';
        } else if (error.code === 'auth/argument-error') {
            errorMessage = 'Invalid token format.';
        } else if (error.code === 'auth/id-token-revoked') {
            errorMessage = 'Token has been revoked. Please sign in again.';
        }
        
        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.code || 'AUTH_ERROR'
        });
    }
};

export const verifyFirebaseToken = async (req, res, next) => {
    try {
        
        if (!auth) {
            return res.status(503).json({
                success: false,
                message: 'Firebase authentication is not configured. Please set up Firebase credentials.'
            });
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header is required. Format: Bearer <token>'
            });
        }
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header format. Expected: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1]; 
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Valid Firebase ID token is required'
            });
        }
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Token must be a valid JWT.'
            });
        }
        // Enhanced token verification with debugging
        console.log(`🔍 Token verification attempt for token length: ${token.length}`);
        console.log(`🔍 Token preview: ${token.substring(0, 50)}...`);
        
        const decodedToken = await auth.verifyIdToken(token);
        
        // Log detailed token information for debugging
        console.log(`✅ Token verified successfully`);
        console.log(`🔍 Decoded token details:`, {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            provider: decodedToken.firebase?.sign_in_provider,
            authTime: decodedToken.auth_time,
            issuedAt: decodedToken.iat,
            expiresAt: decodedToken.exp,
            audience: decodedToken.aud,
            issuer: decodedToken.iss
        });
        
        // Check if token is from Google OAuth vs email/password
        const signInProvider = decodedToken.firebase?.sign_in_provider;
        console.log(`🔍 Sign-in provider: ${signInProvider}`);
        
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            signInProvider: signInProvider,
            firebaseUser: decodedToken
        };

        next();
    } catch (error) {
        // Enhanced error logging for debugging
        console.error('🚨 Firebase token verification error:', error.message);
        console.error('🚨 Error code:', error.code);
        console.error('🚨 Error details:', error);
        
        // Additional debugging for token structure
        if (token) {
            try {
                const tokenParts = token.split('.');
                console.log(`🔍 Token parts count: ${tokenParts.length}`);
                if (tokenParts.length === 3) {
                    // Decode JWT header and payload for debugging (without verification)
                    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    console.log(`🔍 Token header:`, header);
                    console.log(`🔍 Token payload preview:`, {
                        iss: payload.iss,
                        aud: payload.aud,
                        exp: payload.exp,
                        iat: payload.iat,
                        sub: payload.sub,
                        provider: payload.firebase?.sign_in_provider
                    });
                }
            } catch (decodeError) {
                console.error('🚨 Failed to decode token for debugging:', decodeError.message);
            }
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.error('Full error details:', error);
        }
        
        // Specific error handling for different Firebase auth errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
                error: 'TOKEN_EXPIRED',
                debug: process.env.NODE_ENV === 'development' ? {
                    errorCode: error.code,
                    tokenLength: token?.length,
                    message: error.message
                } : undefined
            });
        }
        
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Please provide a valid Firebase ID token.',
                error: 'INVALID_TOKEN_FORMAT',
                debug: process.env.NODE_ENV === 'development' ? {
                    errorCode: error.code,
                    tokenLength: token?.length,
                    message: error.message
                } : undefined
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                success: false,
                message: 'Token has been revoked. Please login again.',
                error: 'TOKEN_REVOKED',
                debug: process.env.NODE_ENV === 'development' ? {
                    errorCode: error.code,
                    message: error.message
                } : undefined
            });
        }
        
        // Check for project mismatch errors (common with Google OAuth)
        if (error.message.includes('project') || error.message.includes('audience')) {
            return res.status(401).json({
                success: false,
                message: 'Token was issued for a different Firebase project. Please ensure you are using the correct project configuration.',
                error: 'PROJECT_MISMATCH',
                debug: process.env.NODE_ENV === 'development' ? {
                    errorCode: error.code,
                    message: error.message,
                    expectedProject: process.env.FIREBASE_PROJECT_ID
                } : undefined
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.',
            error: 'AUTHENTICATION_FAILED',
            debug: process.env.NODE_ENV === 'development' ? {
                errorCode: error.code,
                message: error.message,
                tokenLength: token?.length
            } : undefined
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        console.log('🔐 optionalAuth: Starting token verification...');
        
        if (!auth) {
            console.log('⚠️ optionalAuth: Firebase auth not initialized');
            req.user = null;
            return next();
        }

        const authHeader = req.headers.authorization;
        
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('⚠️ optionalAuth: No Bearer token in Authorization header');
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            console.log('⚠️ optionalAuth: Token is empty or invalid');
            req.user = null;
            return next();
        }
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.log('⚠️ optionalAuth: Token is not a valid JWT format');
            req.user = null;
            return next();
        }
        
        console.log(`🔍 optionalAuth: Verifying token (length: ${token.length})...`);
        const decodedToken = await auth.verifyIdToken(token);
        console.log(`✅ optionalAuth: Token verified for user ${decodedToken.email}`);
        
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            firebaseUser: decodedToken
        };

        next();
    } catch (error) {
        console.error('❌ optionalAuth: Token verification failed:', error.message);
        console.error('❌ optionalAuth: Error code:', error.code);
        req.user = null;
        next();
    }
};