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
