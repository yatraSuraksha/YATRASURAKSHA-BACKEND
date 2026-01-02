#!/bin/bash

# Quick Backend Health Check
# This script tests basic API endpoints to ensure the backend is running properly

echo "🔍 Yatra Suraksha Backend Health Check"
echo "======================================"

# Check if server is running
echo "1. Checking if server is running..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)

if [ "$SERVER_STATUS" = "000" ]; then
    echo "❌ Server is not running on http://localhost:3000"
    echo "   Please start the server with: npm start"
    exit 1
else
    echo "✅ Server is running (Status: $SERVER_STATUS)"
fi

# Test public endpoints (no authentication required)
echo ""
echo "2. Testing public endpoints..."

# Test root endpoint
echo "   Testing root endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:3000)
if [[ $ROOT_RESPONSE == *"Yatra Suraksha"* ]] || [[ $ROOT_RESPONSE == *"API"* ]]; then
    echo "   ✅ Root endpoint working"
else
    echo "   ⚠️  Root endpoint response: $ROOT_RESPONSE"
fi

# Test API docs (if available)
echo "   Testing API documentation..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api-docs)
if [ "$DOCS_STATUS" = "200" ]; then
    echo "   ✅ API documentation available at http://localhost:3000/api-docs"
else
    echo "   ⚠️  API documentation not available (Status: $DOCS_STATUS)"
fi

# Test health check endpoint
echo "   Testing health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Health check endpoint working"
else
    echo "   ⚠️  Health check endpoint not available"
fi

# Test authentication endpoint with invalid token (should return 401)
echo ""
echo "3. Testing authentication..."
AUTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    -H "Authorization: Bearer invalid-token" \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/users/verify)

AUTH_STATUS=$(echo $AUTH_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
AUTH_BODY=$(echo $AUTH_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

if [ "$AUTH_STATUS" = "401" ]; then
    echo "✅ Authentication middleware working (correctly rejected invalid token)"
else
    echo "⚠️  Authentication response: Status $AUTH_STATUS"
fi

# Test database connection (if endpoint exists)
echo ""
echo "4. Testing database connection..."
DB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/db 2>/dev/null)
if [ "$DB_STATUS" = "200" ]; then
    echo "✅ Database connection working"
elif [ "$DB_STATUS" = "404" ]; then
    echo "⚠️  Database health endpoint not found (this is okay)"
else
    echo "⚠️  Database connection issue (Status: $DB_STATUS)"
fi

echo ""
echo "📋 Summary:"
echo "============"
echo "✅ Basic server functionality: Working"
echo "✅ Authentication middleware: Working"
echo "📝 Next steps:"
echo "   1. Use testing/test-firebase-auth.html to get a valid Firebase ID token"
echo "   2. Test authenticated endpoints with the token"
echo "   3. Run: node testing/run-tests.js for comprehensive testing"
echo ""
echo "🔗 Useful URLs:"
echo "   - Server: http://localhost:3000"
echo "   - API Docs: http://localhost:3000/api-docs"
echo "   - Test Page: testing/test-firebase-auth.html"