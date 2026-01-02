#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Yatra Suraksha - Configuration Validator${NC}"
echo -e "${BLUE}==========================================${NC}"

# Function to check if file exists and display status
check_file() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ $description: Found${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Not found${NC}"
        return 1
    fi
}

# Function to check if directory exists and display status
check_directory() {
    local dir_path="$1"
    local description="$2"
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✅ $description: Found${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Not found${NC}"
        return 1
    fi
}

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "\n${YELLOW}📋 Basic Configuration Check${NC}"
echo "----------------------------------------"

# Check .env file
check_file ".env" ".env configuration file"

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs) 2>/dev/null
fi

# Check .env.example
check_file ".env.example" ".env.example template"

# Check package.json
check_file "package.json" "package.json"

echo -e "\n${YELLOW}🔗 Hyperledger Fabric Configuration${NC}"
echo "----------------------------------------"

# Check if HYPERLEDGER_FABRIC_PATH is set
if [ -n "$HYPERLEDGER_FABRIC_PATH" ]; then
    echo -e "${GREEN}✅ HYPERLEDGER_FABRIC_PATH environment variable: Set${NC}"
    echo "   Path: $HYPERLEDGER_FABRIC_PATH"
    
    # Validate the path
    if check_directory "$HYPERLEDGER_FABRIC_PATH" "Fabric samples directory"; then
        # Check for essential Fabric components
        check_file "$HYPERLEDGER_FABRIC_PATH/bin/peer" "Fabric peer binary"
        check_file "$HYPERLEDGER_FABRIC_PATH/bin/orderer" "Fabric orderer binary"
        check_file "$HYPERLEDGER_FABRIC_PATH/bin/configtxgen" "Fabric configtxgen binary"
        check_directory "$HYPERLEDGER_FABRIC_PATH/config" "Fabric config directory"
    fi
else
    echo -e "${YELLOW}⚠️  HYPERLEDGER_FABRIC_PATH not set - will auto-detect${NC}"
    
    # Try auto-detection
    echo -e "\n${BLUE}🔍 Auto-detecting Fabric installation...${NC}"
    
    POSSIBLE_PATHS=(
        "/home/$USER/fabric-samples"
        "/opt/fabric-samples"
        "/usr/local/fabric-samples"
        "$HOME/fabric-samples"
        "$HOME/hyperledger/fabric-samples"
        "$HOME/Documents/fabric-samples"
        "$HOME/Documents/Projects/fabric-samples"
        "$HOME/Documents/Projects/BLOCKCHAIN/fabric/fabric-samples"
    )
    
    FOUND_PATH=""
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -d "$path" ] && [ -f "$path/bin/peer" ]; then
            echo -e "${GREEN}✅ Found Fabric installation: $path${NC}"
            FOUND_PATH="$path"
            break
        fi
    done
    
    if [ -z "$FOUND_PATH" ]; then
        echo -e "${RED}❌ No Fabric installation found in common paths${NC}"
        echo -e "${YELLOW}💡 Please set HYPERLEDGER_FABRIC_PATH in your .env file${NC}"
    fi
fi

echo -e "\n${YELLOW}🔧 Fabric Network Files${NC}"
echo "----------------------------------------"

# Check fabric network structure
check_directory "fabric-network" "Fabric network directory"
check_directory "fabric-network/chaincodes" "Chaincode directory"
check_directory "fabric-network/scripts" "Scripts directory"
check_file "fabric-network/scripts/quick-setup.sh" "Quick setup script"
check_file "fabric-network/scripts/setup-network.sh" "Network setup script"

echo -e "\n${YELLOW}📦 Node.js Dependencies${NC}"
echo "----------------------------------------"

# Check if node_modules exists
check_directory "node_modules" "Node.js dependencies"

# Check if npm is available
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm: Available${NC}"
else
    echo -e "${RED}❌ npm: Not found${NC}"
fi

# Check if node is available
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: Available ($(node --version))${NC}"
else
    echo -e "${RED}❌ Node.js: Not found${NC}"
fi

echo -e "\n${YELLOW}🐳 Docker Check${NC}"
echo "----------------------------------------"

# Check if docker is available
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker: Available ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))${NC}"
    
    # Check if docker is running
    if docker info &> /dev/null; then
        echo -e "${GREEN}✅ Docker daemon: Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker daemon: Not running${NC}"
    fi
else
    echo -e "${RED}❌ Docker: Not found${NC}"
fi

# Check if docker-compose is available (check both v1 and v2)
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (standalone): Available ($(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1))${NC}"
elif docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (plugin): Available ($(docker compose version | cut -d' ' -f4))${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose: Not found (required for Fabric network)${NC}"
fi

echo -e "\n${BLUE}📊 Configuration Summary${NC}"
echo "=========================================="

echo -e "\n${GREEN}✅ Ready to run:${NC}"
echo "   npm install"
echo "   npm run dev"

if [ -n "$FOUND_PATH" ] || [ -n "$HYPERLEDGER_FABRIC_PATH" ]; then
    echo -e "\n${GREEN}✅ Ready for Fabric setup:${NC}"
    echo "   npm run fabric:setup"
    echo "   npm run fabric:crypto"
    echo "   npm run fabric:start"
else
    echo -e "\n${YELLOW}⚠️  For Fabric functionality:${NC}"
    echo "   1. Install Hyperledger Fabric"
    echo "   2. Set HYPERLEDGER_FABRIC_PATH in .env"
    echo "   3. Run npm run fabric:setup"
fi

echo -e "\n${BLUE}📖 For detailed setup instructions:${NC}"
echo "   - Check README.md"
echo "   - Review .env.example"
echo ""