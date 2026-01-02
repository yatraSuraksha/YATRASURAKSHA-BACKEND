#!/bin/bash

# YATRA-SURAKSHA Blockchain Separation Script
# This script helps separate blockchain components to another VPS

echo "🔄 YATRA-SURAKSHA Blockchain Separation Tool"
echo "=============================================="

# Create backup
echo "📦 Creating backup of current setup..."
BACKUP_DIR="blockchain-separation-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup blockchain-related files
echo "📋 Backing up blockchain files..."
cp -r fabric-network/ "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ fabric-network/ not found"
cp -r fabric-samples/ "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ fabric-samples/ not found"
cp blockchain-*.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ blockchain-*.js files not found"
cp pure-blockchain-interface.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ pure-blockchain-interface.js not found"
cp src/services/fabric.service.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ fabric.service.js not found"
cp src/routes/blockchain.router.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ blockchain.router.js not found"

# Copy documentation
cp BLOCKCHAIN_*.md "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ Blockchain documentation not found"
cp WORKING_HYPERLEDGER_SETUP.md "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ Setup documentation not found"

echo "✅ Backup created in: $BACKUP_DIR"

# Create blockchain VPS package
echo "📦 Creating blockchain VPS deployment package..."
BLOCKCHAIN_PACKAGE="yatra-blockchain-vps-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BLOCKCHAIN_PACKAGE"

# Copy essential blockchain files
cp -r fabric-network/ "$BLOCKCHAIN_PACKAGE/" 2>/dev/null
cp -r fabric-samples/ "$BLOCKCHAIN_PACKAGE/" 2>/dev/null
cp blockchain-*.js "$BLOCKCHAIN_PACKAGE/" 2>/dev/null
cp pure-blockchain-interface.js "$BLOCKCHAIN_PACKAGE/" 2>/dev/null

# Copy blockchain service
mkdir -p "$BLOCKCHAIN_PACKAGE/src/services"
cp src/services/fabric.service.js "$BLOCKCHAIN_PACKAGE/src/services/" 2>/dev/null

# Copy blockchain router
mkdir -p "$BLOCKCHAIN_PACKAGE/src/routes" 
cp src/routes/blockchain.router.js "$BLOCKCHAIN_PACKAGE/src/routes/" 2>/dev/null

# Copy documentation
cp BLOCKCHAIN_*.md "$BLOCKCHAIN_PACKAGE/" 2>/dev/null
cp WORKING_HYPERLEDGER_SETUP.md "$BLOCKCHAIN_PACKAGE/" 2>/dev/null

# Create deployment README
cat > "$BLOCKCHAIN_PACKAGE/DEPLOYMENT_README.md" << 'EOF'
# YATRA-SURAKSHA Blockchain VPS Deployment

## 🚀 Quick Setup

1. **Install Dependencies:**
   ```bash
   npm install express cors helmet fabric-network
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your blockchain network settings
   ```

3. **Start Blockchain API Server:**
   ```bash
   node pure-blockchain-interface.js
   ```

4. **Verify Setup:**
   ```bash
   curl http://localhost:3003/api/blockchain/health
   ```

## 🔧 Main Backend Configuration

Update your main backend `.env` file:
```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_API_URL=http://your-blockchain-vps-ip:3003/api/blockchain
BLOCKCHAIN_API_KEY=your-secure-api-key
```

## 📡 API Endpoints

- `GET /api/blockchain/health` - Health check
- `POST /api/blockchain/tourist/create` - Create tourist ID
- `POST /api/blockchain/location/log` - Log location update
- `POST /api/blockchain/incident/log` - Log incident
- `GET /api/blockchain/audit/{touristId}` - Get audit trail

## 🔒 Security

- Use strong API keys
- Configure firewall rules
- Enable HTTPS in production
- Regular security updates

EOF

echo "✅ Blockchain VPS package created: $BLOCKCHAIN_PACKAGE"

# Create archive
echo "🗜️ Creating deployment archive..."
tar -czf "${BLOCKCHAIN_PACKAGE}.tar.gz" "$BLOCKCHAIN_PACKAGE/"
echo "✅ Archive created: ${BLOCKCHAIN_PACKAGE}.tar.gz"

# Summary
echo ""
echo "🎯 SEPARATION SUMMARY"
echo "===================="
echo "✅ Backup created: $BACKUP_DIR"
echo "✅ VPS package: $BLOCKCHAIN_PACKAGE"
echo "✅ Archive ready: ${BLOCKCHAIN_PACKAGE}.tar.gz"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Copy ${BLOCKCHAIN_PACKAGE}.tar.gz to your blockchain VPS"
echo "2. Extract and deploy on VPS following DEPLOYMENT_README.md"
echo "3. Update main backend .env with VPS URL"
echo "4. Test blockchain health endpoint"
echo "5. Remove local blockchain files (optional)"
echo ""
echo "⚠️  IMPORTANT: Test thoroughly before removing local blockchain files!"

# Optional cleanup prompt
read -p "🗑️ Remove local blockchain files now? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up local blockchain files..."
    
    # Remove directories
    rm -rf fabric-network/ 2>/dev/null && echo "✅ Removed fabric-network/"
    rm -rf fabric-samples/ 2>/dev/null && echo "✅ Removed fabric-samples/"
    
    # Remove files
    rm -f blockchain-*.js 2>/dev/null && echo "✅ Removed blockchain-*.js files"
    rm -f pure-blockchain-interface.js 2>/dev/null && echo "✅ Removed pure-blockchain-interface.js"
    rm -f src/services/fabric.service.js 2>/dev/null && echo "✅ Removed fabric.service.js"
    rm -f src/routes/blockchain.router.js 2>/dev/null && echo "✅ Removed blockchain.router.js"
    
    # Remove documentation
    rm -f BLOCKCHAIN_*.md 2>/dev/null && echo "✅ Removed blockchain documentation"
    rm -f WORKING_HYPERLEDGER_SETUP.md 2>/dev/null && echo "✅ Removed setup documentation"
    
    echo "🎉 Local blockchain files removed! Use backup if needed: $BACKUP_DIR"
else
    echo "👍 Local blockchain files preserved. Remove manually when ready."
fi

echo ""
echo "🎉 Blockchain separation completed successfully!"
echo "📖 Check ${BLOCKCHAIN_PACKAGE}/DEPLOYMENT_README.md for deployment instructions"