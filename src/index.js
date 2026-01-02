import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import connectDB from './db/index.db.js'
import userRouter from './routes/user.router.js'
import ocrRouter from './routes/ocr.router.js'
import trackingRouter from './routes/tracking.router.js'
import { initializeSocketIO } from './services/socket.service.js'
import { cleanupOrphanedRecords } from './middlewares/validation.middleware.js'
import inactivityService from './services/inactivity.service.js'
import cron from 'node-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
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
}))

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
        console.log(`Server is running on http://${HOST}:${PORT}`)
        
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