#!/bin/bash

# Export Working Hyperledger Setup
# This script packages everything that works on this machine for server deployment

echo "📦 Exporting Working Hyperledger Setup..."

# Create export directory
EXPORT_DIR="hyperledger-working-export-$(date +%Y%m%d_%H%M%S)"
mkdir -p $EXPORT_DIR

echo "📁 Export directory: $EXPORT_DIR"

# 1. Copy working chaincode
echo "📋 Copying working chaincode..."
cp /home/thisisharshavardhan/Documents/Projects/N5N/YATRA-SURAKSHA-BACKEND/fabric-network/chaincodes/digital-tourist-id.js $EXPORT_DIR/

# 2. Copy working pure blockchain interface
echo "🔗 Copying pure blockchain interface..."
cp /home/thisisharshavardhan/Documents/Projects/N5N/YATRA-SURAKSHA-BACKEND/pure-blockchain-interface.js $EXPORT_DIR/

# 3. Create deployment script
echo "🚀 Creating deployment script..."
cat > $EXPORT_DIR/deploy-on-server.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying YATRA-SURAKSHA Hyperledger on Server..."

# Step 1: Install Hyperledger Fabric
echo "📦 Installing Hyperledger Fabric 2.5.12..."
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.12 1.5.13

# Step 2: Go to test network
cd fabric-samples/test-network-nano-bash

# Step 3: Start network
echo "🌐 Starting network..."
./network.sh start

# Step 4: Set environment
echo "⚙️ Setting environment..."
source ./peer1admin.sh

# Step 5: Copy chaincode
echo "📋 Copying chaincode..."
cp ../digital-tourist-id.js ./

# Step 6: Package chaincode
echo "📦 Packaging chaincode..."
peer lifecycle chaincode package digital-tourist-id.tar.gz \
  --path ./digital-tourist-id.js \
  --lang node \
  --label digital-tourist-id_2.0

# Step 7: Install chaincode
echo "⬇️ Installing chaincode..."
peer lifecycle chaincode install digital-tourist-id.tar.gz

# Step 8: Get package ID
echo "🔍 Getting package ID..."
export PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep digital-tourist-id_2.0 | cut -d' ' -f3 | cut -d',' -f1)
echo "Package ID: $PACKAGE_ID"

# Step 9: Approve chaincode
echo "✅ Approving chaincode..."
peer lifecycle chaincode approveformyorg \
  -o 127.0.0.1:6050 \
  --channelID mychannel \
  --name digital-tourist-id \
  --version 2.0 \
  --package-id $PACKAGE_ID \
  --sequence 2

# Step 10: Commit chaincode
echo "🔗 Committing chaincode..."
peer lifecycle chaincode commit \
  -o 127.0.0.1:6050 \
  --channelID mychannel \
  --name digital-tourist-id \
  --version 2.0 \
  --sequence 2

# Step 11: Test chaincode
echo "🧪 Testing chaincode..."
peer chaincode query -C mychannel -n digital-tourist-id -c '{"Args":["getAllTourists"]}'

# Step 12: Start pure blockchain interface
echo "🔗 Starting pure blockchain interface..."
export CORE_PEER_TLS_SERVERHOSTOVERRIDE='peer0.org1.example.com'
cd ..
nohup node pure-blockchain-interface.js > blockchain-interface.log 2>&1 &

echo "✅ Deployment complete!"
echo "🌐 Blockchain interface running on port 3003"
echo "📊 Check status: curl http://localhost:3003/blockchain/status"
echo "📋 View logs: tail -f blockchain-interface.log"
EOF

chmod +x $EXPORT_DIR/deploy-on-server.sh

# 4. Create verification script
echo "🔍 Creating verification script..."
cat > $EXPORT_DIR/verify-deployment.sh << 'EOF'
#!/bin/bash

echo "🔍 Verifying Hyperledger Deployment..."

cd fabric-samples/test-network-nano-bash
source ./peer1admin.sh

echo "📊 Channel Info:"
peer channel getinfo -c mychannel

echo ""
echo "📦 Committed Chaincodes:"
peer lifecycle chaincode querycommitted -C mychannel

echo ""
echo "🧪 Testing getAllTourists:"
peer chaincode query -C mychannel -n digital-tourist-id -c '{"Args":["getAllTourists"]}'

echo ""
echo "🔗 Testing API Interface:"
curl -s http://localhost:3003/blockchain/status | head -20

echo ""
echo "✅ Verification complete!"
EOF

chmod +x $EXPORT_DIR/verify-deployment.sh

# 5. Create README with exact steps
echo "📄 Creating README..."
cat > $EXPORT_DIR/README.md << 'EOF'
# YATRA-SURAKSHA Hyperledger Working Setup

## 🎯 This Export Contains

- `digital-tourist-id.js` - Working chaincode
- `pure-blockchain-interface.js` - Working API interface  
- `deploy-on-server.sh` - Automated deployment script
- `verify-deployment.sh` - Verification script

## 🚀 Quick Server Deployment

1. **Copy files to server:**
   ```bash
   scp -r hyperledger-working-export-* user@server:/opt/
   ```

2. **Run deployment:**
   ```bash
   cd /opt/hyperledger-working-export-*
   sudo ./deploy-on-server.sh
   ```

3. **Verify everything works:**
   ```bash
   ./verify-deployment.sh
   ```

## ✅ Expected Results

- Hyperledger Fabric 2.5.12 running
- mychannel created
- digital-tourist-id chaincode v2.0 deployed
- getAllTourists function working
- Pure blockchain interface on port 3003

## 🔧 Manual Steps (if script fails)

Follow the exact steps in `deploy-on-server.sh` manually.

## 📞 Troubleshooting

- Ensure Node.js is installed for pure-blockchain-interface.js
- Check ports 7051, 6050, 3003 are open
- Verify Docker is running
- Check logs in blockchain-interface.log
EOF

# 6. Export current blockchain data (if needed)
echo "💾 Exporting current blockchain data..."
cd /home/thisisharshavardhan/Documents/Projects/BLOCKCHAIN/fabric-samples/test-network-nano-bash
source ./peer1admin.sh
peer chaincode query -C mychannel -n digital-tourist-id -c '{"Args":["getAllTourists"]}' > ../$EXPORT_DIR/current-tourists-data.json 2>/dev/null || echo "Could not export current data"

echo "✅ Export complete!"
echo "📁 Location: $EXPORT_DIR"
echo ""
echo "📋 Files exported:"
ls -la $EXPORT_DIR
echo ""
echo "🚀 To deploy on server:"
echo "1. Copy folder to server: scp -r $EXPORT_DIR user@server:/opt/"
echo "2. Run: cd /opt/$EXPORT_DIR && ./deploy-on-server.sh"
echo "3. Verify: ./verify-deployment.sh"