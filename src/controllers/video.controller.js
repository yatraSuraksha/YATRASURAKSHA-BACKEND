import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

        const videoInfo = {
            id: req.file.filename.split('.')[0],
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            sizeFormatted: formatFileSize(req.file.size),
            path: `/api/videos/stream/${req.file.filename}`,
            downloadPath: `/api/videos/download/${req.file.filename}`,
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.user?.uid || 'anonymous'
        };

        res.status(201).json({
            success: true,
            message: 'Video uploaded successfully',
            data: videoInfo
        });
    } catch (error) {
        console.error('Error uploading video:', error);
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

        const videos = req.files.map(file => ({
            id: file.filename.split('.')[0],
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            sizeFormatted: formatFileSize(file.size),
            path: `/api/videos/stream/${file.filename}`,
            downloadPath: `/api/videos/download/${file.filename}`,
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.user?.uid || 'anonymous'
        }));

        res.status(201).json({
            success: true,
            message: `${videos.length} video(s) uploaded successfully`,
            data: videos
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
 * List all videos
 */
export const listVideos = async (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR);
        const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
        
        const videos = files
            .filter(file => videoExtensions.includes(path.extname(file).toLowerCase()))
            .map(filename => {
                const filePath = path.join(VIDEOS_DIR, filename);
                const stats = fs.statSync(filePath);
                return {
                    id: filename.split('.')[0],
                    filename,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    path: `/api/videos/stream/${filename}`,
                    downloadPath: `/api/videos/download/${filename}`,
                    thumbnailPath: `/api/videos/thumbnail/${filename}`,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            count: videos.length,
            data: videos
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

        res.download(videoPath, filename);
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
        const videoPath = path.join(VIDEOS_DIR, filename);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        fs.unlinkSync(videoPath);

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
 * Helper function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
