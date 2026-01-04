import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { Server } from 'socket.io'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import connectDB from './db/index.db.js'
import userRouter from './routes/user.router.js'
import ocrRouter from './routes/ocr.router.js'
import trackingRouter from './routes/tracking.router.js'
import familyRouter from './routes/family.router.js'
import mapsRouter from './routes/maps.router.js'
import videoRouter from './routes/video.router.js'
import { initializeSocketIO } from './services/socket.service.js'
import { cleanupOrphanedRecords } from './middlewares/validation.middleware.js'
import inactivityService from './services/inactivity.service.js'
import cron from 'node-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// SSL Certificate paths
const SSL_KEY_PATH = '/etc/letsencrypt/live/yatra-suraksha.n5n.live/privkey.pem'
const SSL_CERT_PATH = '/etc/letsencrypt/live/yatra-suraksha.n5n.live/fullchain.pem'

// Check if SSL certificates exist
const sslEnabled = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)

const app = express()

// Create HTTP or HTTPS server based on SSL availability
let server
if (sslEnabled) {
    const sslOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH)
    }
    server = createHttpsServer(sslOptions, app)
    console.log('🔒 SSL certificates found - HTTPS enabled')
} else {
    server = createServer(app)
    console.log('⚠️  SSL certificates not found - Running HTTP only')
}

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
})
initializeSocketIO(io)

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Yatra Suraksha API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    }
}))

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Yatra Suraksha Backend API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        documentation: '/api-docs'
    })
})

app.use('/api/users', userRouter)
app.use('/api/ocr', ocrRouter)
app.use('/api/tracking', trackingRouter)
app.use('/api/family', familyRouter)
app.use('/api/maps', mapsRouter)
app.use('/api/videos', videoRouter)

// Blockchain health check endpoint
app.get('/api/blockchain/health', async (req, res) => {
    try {
        const blockchainClientService = (await import('./services/blockchain-client.service.js')).default;
        const healthStatus = await blockchainClientService.getHealthStatus();
        
        res.json({
            success: true,
            message: 'Blockchain health check completed',
            data: healthStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Blockchain health check failed',
            error: error.message
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
})

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

connectDB().then(() => {
    server.listen(PORT, HOST, () => {
        const protocol = sslEnabled ? 'https' : 'http'
        console.log(`🚀 Server is running on ${protocol}://${HOST}:${PORT}`)
        console.log(`📚 API Documentation: ${protocol}://${HOST}:${PORT}/api-docs`)
        
        // Start inactivity monitoring service
        inactivityService.startMonitoring();
        
        // cron.schedule('0 2 * * *', () => {
        //     cleanupOrphanedRecords();
        // });
        // setTimeout(() => {
        //     cleanupOrphanedRecords();
        // }, 5000);
    })
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});