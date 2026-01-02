#!/bin/bash

# YATRA-SURAKSHA Main Backend Configuration Update Script
# Run this on your main backend server after blockchain VPS is setup

echo "🔧 Updating Main Backend Configuration for Blockchain VPS"
echo "========================================================"

# Get blockchain VPS details from user
read -p "🌐 Enter your Blockchain VPS IP address: " BLOCKCHAIN_IP
read -p "🔑 Enter the API key generated during blockchain setup: " API_KEY

if [ -z "$BLOCKCHAIN_IP" ] || [ -z "$API_KEY" ]; then
    echo "❌ Error: Both IP address and API key are required"
    exit 1
fi

# Backup current .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backed up current .env file"
fi

# Update .env file
echo "⚙️ Updating .env configuration..."

# Remove old blockchain settings if they exist
sed -i '/^BLOCKCHAIN_ENABLED=/d' .env
sed -i '/^BLOCKCHAIN_API_URL=/d' .env
sed -i '/^BLOCKCHAIN_API_KEY=/d' .env

# Add new blockchain configuration
echo "" >> .env
echo "# Blockchain VPS Configuration" >> .env
echo "BLOCKCHAIN_ENABLED=true" >> .env
echo "BLOCKCHAIN_API_URL=http://$BLOCKCHAIN_IP:3003" >> .env
echo "BLOCKCHAIN_API_KEY=$API_KEY" >> .env

echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Added configuration:"
echo "  BLOCKCHAIN_ENABLED=true"
echo "  BLOCKCHAIN_API_URL=http://$BLOCKCHAIN_IP:3003"
echo "  BLOCKCHAIN_API_KEY=$API_KEY"
echo ""

# Test connection to blockchain VPS
echo "🔍 Testing connection to blockchain VPS..."
curl -s -f -H "x-api-key: $API_KEY" "http://$BLOCKCHAIN_IP:3003/health" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Connection to blockchain VPS successful!"
else
    echo "⚠️  Connection test failed. Please check:"
    echo "   - Blockchain VPS is running"
    echo "   - Port 3003 is open on blockchain VPS"
    echo "   - API key is correct"
    echo "   - IP address is correct"
fi

echo ""
echo "🚀 Configuration complete!"
echo "📋 Next steps:"
echo "1. Restart your main backend: npm run dev"
echo "2. Test blockchain integration with your API endpoints"
echo "3. Monitor logs for blockchain communication"
echo ""
echo "💡 To test manually: curl -H 'x-api-key: $API_KEY' http://$BLOCKCHAIN_IP:3003/health"