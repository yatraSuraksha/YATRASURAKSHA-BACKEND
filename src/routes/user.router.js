import { Router } from "express";
import {
    verifyToken,
    getCurrentUser,
    getTouristProfile,
    updateTouristProfile,
    getProfileStatus,
    getAllTourists,
    getTouristById
} from "../controllers/user.controller.js";
import { verifyFirebaseToken, optionalAuth } from "../middlewares/auth.middleware.js";
import { sanitizeInput, validateObjectId } from "../middlewares/validation.middleware.js";
import { auth } from "../config/firebase.config.js";

const router = Router();
router.use(sanitizeInput);

// Debug endpoint for token troubleshooting
router.post("/debug-token", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({
                success: false,
                message: 'Authorization header with Bearer token required',
                debug: {
                    hasAuthHeader: !!authHeader,
                    authHeaderFormat: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
                }
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Basic token structure analysis
        const tokenParts = token.split('.');
        let tokenAnalysis = {
            tokenLength: token.length,
            partsCount: tokenParts.length,
            isValidJWT: tokenParts.length === 3
        };

        if (tokenParts.length === 3) {
            try {
                const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                
                tokenAnalysis = {
                    ...tokenAnalysis,
                    header: header,
                    payload: {
                        iss: payload.iss,
                        aud: payload.aud,
                        sub: payload.sub,
                        exp: payload.exp,
                        iat: payload.iat,
                        auth_time: payload.auth_time,
                        provider: payload.firebase?.sign_in_provider,
                        email: payload.email,
                        email_verified: payload.email_verified
                    },
                    isExpired: payload.exp < Math.floor(Date.now() / 1000),
                    timeToExpiry: payload.exp - Math.floor(Date.now() / 1000)
                };
            } catch (decodeError) {
                tokenAnalysis.decodeError = decodeError.message;
            }
        }

        // Try Firebase verification
        try {
            const decodedToken = await auth.verifyIdToken(token);
            
            return res.json({
                success: true,
                message: 'Token is valid',
                debug: {
                    tokenAnalysis,
                    firebaseVerification: {
                        success: true,
                        uid: decodedToken.uid,
                        email: decodedToken.email,
                        provider: decodedToken.firebase?.sign_in_provider,
                        emailVerified: decodedToken.email_verified,
                        authTime: decodedToken.auth_time,
                        issuedAt: decodedToken.iat,
                        expiresAt: decodedToken.exp
                    }
                }
            });
        } catch (verifyError) {
            return res.status(401).json({
                success: false,
                message: 'Token verification failed',
                debug: {
                    tokenAnalysis,
                    firebaseVerification: {
                        success: false,
                        error: verifyError.message,
                        errorCode: verifyError.code,
                        expectedProject: process.env.FIREBASE_PROJECT_ID
                    }
                }
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Debug endpoint error',
            error: error.message
        });
    }
});

router.post("/verify", verifyFirebaseToken, verifyToken);
router.get("/me", verifyFirebaseToken, getCurrentUser);
router.get("/profile", getTouristProfile);
router.put("/profile", verifyFirebaseToken, updateTouristProfile);
router.get("/profile/status", verifyFirebaseToken, getProfileStatus);

// Admin routes without authentication
router.get("/all", getAllTourists);
router.get("/:touristId", validateObjectId('touristId'), getTouristById);

export default router;

