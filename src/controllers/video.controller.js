import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Video from '../models/video.model.js';
import Tourist from '../models/tourist.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Videos storage directory
const VIDEOS_DIR = path.join(__dirname, '../../uploads/videos');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/**
 * Upload a video file
 */
export const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file provided'
            });
        }

        const userId = req.user?.uid;
        if (!userId) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(401).json({
                success: false,
                message: 'Authentication required to upload videos'
            });
        }

        // Get uploader info from Tourist collection
        let uploaderName = 'Unknown';
        let uploaderEmail = null;
        try {
            const tourist = await Tourist.findOne({ firebaseUid: userId });
            if (tourist) {
                uploaderName = tourist.personalInfo?.name || 'Unknown';
                uploaderEmail = tourist.personalInfo?.email || null;
            }
        } catch (err) {
            console.warn('Could not fetch uploader info:', err.message);
        }

        const videoId = req.file.filename.split('.')[0];
        const ext = path.extname(req.file.originalname).toLowerCase();

        // Create video record in database
        const video = new Video({
            videoId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            extension: ext,
            uploadedBy: userId,
            uploaderName,
            uploaderEmail,
            title: req.body.title || null,
            description: req.body.description || null,
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
            status: 'ready',
            uploadedAt: new Date()
        });

        // Add location if provided
        if (req.body.latitude && req.body.longitude) {
            video.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
                address: req.body.address || null
            };
        }

        await video.save();

        res.status(201).json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                id: video.videoId,
                filename: video.filename,
                originalName: video.originalName,
                mimetype: video.mimetype,
                size: video.size,
                sizeFormatted: video.sizeFormatted,
                path: video.streamPath,
                downloadPath: video.downloadPath,
                uploadedAt: video.uploadedAt,
                uploadedBy: video.uploadedBy,
                uploaderName: video.uploaderName
            }
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to upload video',
            error: error.message
        });
    }
};

/**
 * Upload multiple videos
 */
export const uploadMultipleVideos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No video files provided'
            });
        }

        const userId = req.user?.uid;
        if (!userId) {
            // Clean up uploaded files
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
            return res.status(401).json({
                success: false,
                message: 'Authentication required to upload videos'
            });
        }

        // Get uploader info
        let uploaderName = 'Unknown';
        let uploaderEmail = null;
        try {
            const tourist = await Tourist.findOne({ firebaseUid: userId });
            if (tourist) {
                uploaderName = tourist.personalInfo?.name || 'Unknown';
                uploaderEmail = tourist.personalInfo?.email || null;
            }
        } catch (err) {
            console.warn('Could not fetch uploader info:', err.message);
        }

        const savedVideos = [];
        for (const file of req.files) {
            const videoId = file.filename.split('.')[0];
            const ext = path.extname(file.originalname).toLowerCase();

            const video = new Video({
                videoId,
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                extension: ext,
                uploadedBy: userId,
                uploaderName,
                uploaderEmail,
                status: 'ready',
                uploadedAt: new Date()
            });

            await video.save();
            savedVideos.push({
                id: video.videoId,
                filename: video.filename,
                originalName: video.originalName,
                mimetype: video.mimetype,
                size: video.size,
                sizeFormatted: video.sizeFormatted,
                path: video.streamPath,
                downloadPath: video.downloadPath,
                uploadedAt: video.uploadedAt,
                uploadedBy: video.uploadedBy
            });
        }

        res.status(201).json({
            success: true,
            message: `${savedVideos.length} video(s) uploaded successfully`,
            data: savedVideos
        });
    } catch (error) {
        console.error('Error uploading videos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload videos',
            error: error.message
        });
    }
};

/**
 * List all videos (admin view - shows all videos)
 */
export const listVideos = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const videos = await Video.findAllActive({ 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
        
        const total = await Video.countDocuments({ isDeleted: false, status: 'ready' });

        res.json({
            success: true,
            count: videos.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: videos.map(v => ({
                id: v.videoId,
                filename: v.filename,
                originalName: v.originalName,
                size: v.size,
                sizeFormatted: v.sizeFormatted,
                path: v.streamPath,
                downloadPath: v.downloadPath,
                uploadedAt: v.uploadedAt,
                uploadedBy: v.uploadedBy,
                uploaderName: v.uploaderName,
                title: v.title,
                description: v.description
            }))
        });
    } catch (error) {
        console.error('Error listing videos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list videos',
            error: error.message
        });
    }
};

/**
 * Get videos for a specific user/tourist
 */
export const getVideosByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const videos = await Video.findByUser(userId, { 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
        
        const total = await Video.countByUser(userId);

        res.json({
            success: true,
            count: videos.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            userId,
            data: videos.map(v => ({
                id: v.videoId,
                filename: v.filename,
                originalName: v.originalName,
                size: v.size,
                sizeFormatted: v.sizeFormatted,
                path: v.streamPath,
                downloadPath: v.downloadPath,
                uploadedAt: v.uploadedAt,
                uploadedBy: v.uploadedBy,
                uploaderName: v.uploaderName,
                title: v.title,
                description: v.description
            }))
        });
    } catch (error) {
        console.error('Error getting videos by user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get videos',
            error: error.message
        });
    }
};

/**
 * Get my videos (authenticated user's videos)
 */
export const getMyVideos = async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { page = 1, limit = 20 } = req.query;

        const videos = await Video.findByUser(userId, { 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
        
        const total = await Video.countByUser(userId);

        res.json({
            success: true,
            count: videos.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            data: videos.map(v => ({
                id: v.videoId,
                filename: v.filename,
                originalName: v.originalName,
                size: v.size,
                sizeFormatted: v.sizeFormatted,
                path: v.streamPath,
                downloadPath: v.downloadPath,
                uploadedAt: v.uploadedAt,
                title: v.title,
                description: v.description
            }))
        });
    } catch (error) {
        console.error('Error getting my videos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get videos',
            error: error.message
        });
    }
};

/**
 * Stream a video (for playback)
 */
export const streamVideo = async (req, res) => {
    try {
        const { filename } = req.params;
        const videoPath = path.join(VIDEOS_DIR, filename);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        // Get mime type based on extension
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.flv': 'video/x-flv',
            '.wmv': 'video/x-ms-wmv',
            '.m4v': 'video/x-m4v'
        };
        const contentType = mimeTypes[ext] || 'video/mp4';

        if (range) {
            // Handle range requests for video seeking
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const file = fs.createReadStream(videoPath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType
            });

            file.pipe(res);
        } else {
            // No range request, send entire file
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType
            });

            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stream video',
            error: error.message
        });
    }
};

/**
 * Download a video
 */
export const downloadVideo = async (req, res) => {
    try {
        const { filename } = req.params;
        const videoPath = path.join(VIDEOS_DIR, filename);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Get original filename from database if available
        const video = await Video.findOne({ filename });
        const downloadName = video?.originalName || filename;

        res.download(videoPath, downloadName);
    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download video',
            error: error.message
        });
    }
};

/**
 * Get video info/metadata
 */
export const getVideoInfo = async (req, res) => {
    try {
        const { filename } = req.params;
        
        // First try to get from database
        const video = await Video.findOne({ filename, isDeleted: false });
        
        if (video) {
            return res.json({
                success: true,
                data: {
                    id: video.videoId,
                    filename: video.filename,
                    originalName: video.originalName,
                    extension: video.extension,
                    mimetype: video.mimetype,
                    size: video.size,
                    sizeFormatted: video.sizeFormatted,
                    path: video.streamPath,
                    downloadPath: video.downloadPath,
                    uploadedAt: video.uploadedAt,
                    uploadedBy: video.uploadedBy,
                    uploaderName: video.uploaderName,
                    title: video.title,
                    description: video.description,
                    location: video.location
                }
            });
        }

        // Fallback to file system
        const videoPath = path.join(VIDEOS_DIR, filename);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        const stats = fs.statSync(videoPath);
        const ext = path.extname(filename).toLowerCase();
        
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.flv': 'video/x-flv',
            '.wmv': 'video/x-ms-wmv',
            '.m4v': 'video/x-m4v'
        };

        res.json({
            success: true,
            data: {
                id: filename.split('.')[0],
                filename,
                extension: ext,
                mimetype: mimeTypes[ext] || 'video/mp4',
                size: stats.size,
                sizeFormatted: formatFileSize(stats.size),
                path: `/api/videos/stream/${filename}`,
                downloadPath: `/api/videos/download/${filename}`,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime
            }
        });
    } catch (error) {
        console.error('Error getting video info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get video info',
            error: error.message
        });
    }
};

/**
 * Delete a video
 */
export const deleteVideo = async (req, res) => {
    try {
        const { filename } = req.params;
        const userId = req.user?.uid;

        // Find video in database
        const video = await Video.findOne({ filename, isDeleted: false });
        
        if (video) {
            // Check if user owns the video or is admin
            // For now, allow deletion by owner only
            if (video.uploadedBy !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own videos'
                });
            }

            // Soft delete in database
            await video.softDelete();
        }

        // Delete physical file
        const videoPath = path.join(VIDEOS_DIR, filename);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete video',
            error: error.message
        });
    }
};

/**
 * Admin: Delete any video
 */
export const adminDeleteVideo = async (req, res) => {
    try {
        const { filename } = req.params;

        // Find and soft delete in database
        const video = await Video.findOne({ filename, isDeleted: false });
        if (video) {
            await video.softDelete();
        }

        // Delete physical file
        const videoPath = path.join(VIDEOS_DIR, filename);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        } else if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete video',
            error: error.message
        });
    }
};

/**
 * Get video statistics
 */
export const getVideoStats = async (req, res) => {
    try {
        const totalVideos = await Video.countDocuments({ isDeleted: false });
        const totalSize = await Video.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]);
        
        const videosByUser = await Video.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                totalVideos,
                totalSize: totalSize[0]?.totalSize || 0,
                totalSizeFormatted: formatFileSize(totalSize[0]?.totalSize || 0),
                topUploaders: videosByUser
            }
        });
    } catch (error) {
        console.error('Error getting video stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get video statistics',
            error: error.message
        });
    }
};

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
