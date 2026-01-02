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
