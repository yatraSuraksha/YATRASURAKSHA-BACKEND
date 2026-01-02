# 🛡️ Yatra Suraksha Backend

**Smart Tourist Safety Monitoring & Incident Response System**

A comprehensive backend system for ensuring tourist safety through blockchain-based digital identity management, real-time location tracking, AI-powered anomaly detection, and emergency response coordination.

## � Documentation

- **🔗 [Blockchain Integration Guide](BLOCKCHAIN_COMPREHENSIVE_GUIDE.md)** - Complete blockchain setup, usage, and troubleshooting
- **🏗️ [System Architecture](SYSTEM_ARCHITECTURE.md)** - Overall system design and components
- **🔒 [Security Guide](SECURITY.md)** - Security implementation and best practices
- **🔌 [Socket Endpoints](SOCKET_ENDPOINTS_REFERENCE.md)** - Real-time communication reference

## �🚀 Quick Start

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB
- Hyperledger Fabric (for blockchain features)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Yatra-Suraksha/YATRA-SURAKSHA-BACKEND.git
   cd YATRA-SURAKSHA-BACKEND
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   **Network Configuration:**
   ```bash
   # Bind to all network interfaces (default)
   HOST=0.0.0.0
   PORT=3000
   
   # Or bind to localhost only for development
   HOST=localhost
   PORT=3000
   ```

3. **Validate configuration (recommended)**
   ```bash
   npm run validate
   ```

4. **Start MongoDB**
   ```bash
   docker pull mongodb/mongodb-community-server:latest
   docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔗 Blockchain Setup (Optional)

For full blockchain functionality with Hyperledger Fabric:

**📖 [Complete Hyperledger Fabric Setup Guide](./HYPERLEDGER-SETUP.md)**

### Configuration

**Step 1: Configure Fabric Path**
```bash
# Method 1: Set in .env file (recommended)
HYPERLEDGER_FABRIC_PATH=/path/to/your/fabric-samples

# Method 2: Auto-detection (script will search common paths)
# If you installed Fabric in a standard location, leave HYPERLEDGER_FABRIC_PATH empty
```

**Common Fabric Installation Paths:**
- Linux/Mac: `~/fabric-samples` or `~/Documents/fabric-samples`
- Custom: `/opt/fabric-samples` or `/usr/local/fabric-samples`

### Quick Commands
```bash
# Setup Fabric network (one-time setup)
npm run fabric:setup
npm run fabric:crypto
npm run fabric:start
npm run fabric:deploy

# Enable blockchain in .env
FABRIC_NETWORK_ENABLED=true

# Restart server
npm run dev
```

## 🏗️ System Architecture

### Core Components
- **Digital ID System**: Blockchain-based tourist identity management
- **OCR Processing**: Aadhaar/Passport document verification  
- **Geo-fencing Engine**: Real-time location monitoring
- **AI Anomaly Detection**: Behavioral pattern analysis
- **Emergency Response**: Panic button and auto E-FIR generation
- **Admin Dashboard**: Tourism department and police monitoring

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Redis
- **Blockchain**: Hyperledger Fabric
- **AI/ML**: Azure Cognitive Services
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.io

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Verify Firebase token

### OCR & Document Processing  
- `POST /api/ocr/process-document` - Process Aadhaar/Passport
- `GET /api/ocr/extraction-history` - Get processing history

### Digital Identity (Blockchain)
- `POST /api/digital-id/issue` - Issue new digital ID
- `POST /api/digital-id/verify` - Verify digital ID
- `GET /api/digital-id/:did` - Get digital ID details

### Location & Geo-fencing
- `POST /api/location/update` - Update tourist location
- `GET /api/geofence/check` - Check geo-fence violations
- `POST /api/geofence/create` - Create new geo-fence

### Emergency Response
- `POST /api/emergency/panic` - Trigger panic button
- `POST /api/emergency/incident` - Report incident
- `GET /api/emergency/active` - Get active emergencies

## 🔧 Configuration

### Environment Variables
```properties
# Basic Configuration
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/yatra-suraksha

# Firebase Authentication
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=config/firebase-adminsdk.json

# Azure Cognitive Services
VISION_KEY=your-azure-vision-key
VISION_ENDPOINT=https://your-region.cognitiveservices.azure.com/

# Blockchain Configuration
FABRIC_NETWORK_ENABLED=false
FABRIC_CONNECTION_PROFILE=fabric-network/connection-profiles/connection-profile.json
```

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm start               # Start production server

# Blockchain Management
npm run fabric:setup    # Setup Fabric network
npm run fabric:start    # Start blockchain network
npm run fabric:stop     # Stop blockchain network
npm run fabric:clean    # Clean all blockchain data

# Database
npm run db:seed         # Seed database with sample data
npm run db:migrate      # Run database migrations
```

