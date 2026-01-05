import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import {
    uploadVideo,
    uploadMultipleVideos,
    listVideos,
    streamVideo,
    downloadVideo,
    getVideoInfo,
    deleteVideo,
    getVideosByUser,
    getMyVideos,
    adminDeleteVideo,
    getVideoStats
} from '../controllers/video.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/videos');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueId}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'video/mp4',
        'video/avi',
        'video/x-msvideo',
        'video/quicktime',
        'video/x-matroska',
        'video/webm',
        'video/x-flv',
        'video/x-ms-wmv',
        'video/x-m4v',
        'video/mpeg',
        'video/3gpp',
        'video/3gpp2'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: MP4, AVI, MOV, MKV, WEBM, FLV, WMV, M4V`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
    }
});

/**
 * @swagger
 * tags:
 *   name: 🎥 Video Management
 *   description: Video upload, streaming, and management endpoints
 */

// ============================================
// SPECIFIC ROUTES FIRST (before parameterized routes)
// ============================================

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a single video
 *     description: Upload a video file to the server. Maximum file size is 500MB.
 *     tags: [🎥 Video Management]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4, AVI, MOV, MKV, WEBM, FLV, WMV, M4V)
 *               title:
 *                 type: string
 *                 description: Optional video title
 *               description:
 *                 type: string
 *                 description: Optional video description
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: No video file provided or invalid file type
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/upload', verifyFirebaseToken, upload.single('video'), uploadVideo);

/**
 * @swagger
 * /api/videos/upload-multiple:
 *   post:
 *     summary: Upload multiple videos
 *     description: Upload up to 10 video files at once. Maximum 500MB per file.
 *     tags: [🎥 Video Management]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - videos
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Video files (max 10 files)
 *     responses:
 *       201:
 *         description: Videos uploaded successfully
 *       400:
 *         description: No video files provided
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/upload-multiple', verifyFirebaseToken, upload.array('videos', 10), uploadMultipleVideos);

/**
 * @swagger
 * /api/videos/my:
 *   get:
 *     summary: Get my videos
 *     description: Get all videos uploaded by the authenticated user
 *     tags: [🎥 Video Management]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Videos per page
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/my', verifyFirebaseToken, getMyVideos);

/**
 * @swagger
 * /api/videos/stats:
 *   get:
 *     summary: Get video statistics
 *     description: Get overall video statistics including total count and size
 *     tags: [🎥 Video Management]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVideos:
 *                       type: number
 *                     totalSize:
 *                       type: number
 *                     totalSizeFormatted:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/stats', getVideoStats);

/**
 * @swagger
 * /api/videos/user/{userId}:
 *   get:
 *     summary: Get videos by user ID
 *     description: Get all videos uploaded by a specific user/tourist
 *     tags: [🎥 Video Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Firebase UID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Videos per page
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', getVideosByUser);

/**
 * @swagger
 * /api/videos/stream/{filename}:
 *   get:
 *     summary: Stream a video
 *     description: Stream a video file for playback. Supports range requests for seeking.
 *     tags: [🎥 Video Management]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The video filename (including extension)
 *         example: "550e8400-e29b-41d4-a716-446655440000.mp4"
 *     responses:
 *       200:
 *         description: Video stream
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial content (range request for seeking)
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.get('/stream/:filename', streamVideo);

/**
 * @swagger
 * /api/videos/download/{filename}:
 *   get:
 *     summary: Download a video
 *     description: Download a video file as an attachment
 *     tags: [🎥 Video Management]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The video filename (including extension)
 *         example: "550e8400-e29b-41d4-a716-446655440000.mp4"
 *     responses:
 *       200:
 *         description: Video file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.get('/download/:filename', downloadVideo);

/**
 * @swagger
 * /api/videos/info/{filename}:
 *   get:
 *     summary: Get video information
 *     description: Get metadata and information about a specific video
 *     tags: [🎥 Video Management]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The video filename (including extension)
 *         example: "550e8400-e29b-41d4-a716-446655440000.mp4"
 *     responses:
 *       200:
 *         description: Video information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: number
 *                     sizeFormatted:
 *                       type: string
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                     uploadedBy:
 *                       type: string
 *                     uploaderName:
 *                       type: string
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.get('/info/:filename', getVideoInfo);

/**
 * @swagger
 * /api/videos/admin/{filename}:
 *   delete:
 *     summary: Admin delete video
 *     description: Delete any video (admin only)
 *     tags: [🎥 Video Management]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The video filename (including extension)
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/:filename', verifyFirebaseToken, adminDeleteVideo);

// ============================================
// GENERIC ROUTES (parameterized routes last)
// ============================================

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: List all videos
 *     description: Get a list of all uploaded videos with their metadata (admin view)
 *     tags: [🎥 Video Management]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Videos per page
 *     responses:
 *       200:
 *         description: List of videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                       size:
 *                         type: number
 *                       sizeFormatted:
 *                         type: string
 *                       path:
 *                         type: string
 *                       downloadPath:
 *                         type: string
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       uploadedBy:
 *                         type: string
 *                       uploaderName:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', listVideos);

/**
 * @swagger
 * /api/videos/{filename}:
 *   delete:
 *     summary: Delete own video
 *     description: Delete a video file (only owner can delete)
 *     tags: [🎥 Video Management]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The video filename (including extension)
 *         example: "550e8400-e29b-41d4-a716-446655440000.mp4"
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: You can only delete your own videos
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.delete('/:filename', verifyFirebaseToken, deleteVideo);

// ============================================
// ERROR HANDLING
// ============================================

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 500MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files'
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

export default router;
