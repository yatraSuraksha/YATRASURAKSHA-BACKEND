import { Router } from 'express';
import multer from 'multer';
import { processDocument } from '../controllers/ocr.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.middleware.js';

const router = Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/bmp',
        'image/tiff',
        'image/tif',
        'application/octet-stream' 
    ];
    
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    console.log(`Uploaded file: ${file.originalname}, MIME type: ${file.mimetype}, Extension: ${fileExtension}`);
    
    
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype.toLowerCase());
    const isValidExtension = allowedExtensions.includes(fileExtension);
    
    if (isValidMimeType || isValidExtension) {
        
        if (file.mimetype === 'application/octet-stream' && isValidExtension) {
            console.log(`📸 Accepting file with octet-stream MIME type due to valid image extension: ${fileExtension}`);
        }
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file format: ${file.mimetype} (${fileExtension}). Supported formats: JPEG, PNG, BMP, TIFF`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },
    fileFilter: fileFilter
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size allowed is 10MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Please upload only one document at a time.'
            });
        }
    }
    
    if (err.message.includes('Only image files')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, etc.).'
        });
    }

    next(err);
};

router.post('/process', 
    upload.single('document'), 
    handleUploadError, 
    processDocument
);

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'OCR service is running',
        timestamp: new Date().toISOString(),
        services: {
            azure: !!process.env.VISION_KEY && !!process.env.VISION_ENDPOINT,
            upload: true
        }
    });
});

export default router;