#!/bin/bash

# YATRA-SURAKSHA Blockchain Deployment Script
# This script automates the deployment of the blockchain network on a new server

set -e

echo "🚀 YATRA-SURAKSHA Blockchain Deployment Starting..."

# Configuration
INSTALL_DIR="/opt/yatra-blockchain"
FABRIC_VERSION="2.5.12"
CA_VERSION="1.5.13"
SERVER_IP=${1:-"localhost"}

if [ "$SERVER_IP" = "localhost" ]; then
    echo "⚠️  Warning: Using localhost. For production, run: ./deploy.sh YOUR_SERVER_IP"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker
install_docker() {
    if command_exists docker; then
        echo "✅ Docker already installed"
        return
    fi
    
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
}

# Function to install Docker Compose
install_docker_compose() {
    if command_exists docker-compose; then
        echo "✅ Docker Compose already installed"
        return
    fi
    
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
}

# Function to install Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            echo "✅ Node.js $NODE_VERSION already installed"
            return
        fi
    fi
    
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
}

# Function to install Go
install_go() {
    if command_exists go; then
        echo "✅ Go already installed: $(go version)"
        return
    fi
    
    echo "📦 Installing Go 1.21..."
    wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go1.21.5.linux-amd64.tar.gz
    echo "✅ Go installed: $(go version)"
}

# Function to install Hyperledger Fabric
install_fabric() {
    if [ -d "/opt/fabric-samples" ]; then
        echo "✅ Hyperledger Fabric already installed"
        return
    fi
    
    echo "📦 Installing Hyperledger Fabric $FABRIC_VERSION..."
    cd /opt
    sudo mkdir -p fabric-samples
    sudo chown $USER:$USER fabric-samples
    cd fabric-samples
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- $FABRIC_VERSION $CA_VERSION
    echo "✅ Hyperledger Fabric installed"
}

# Function to setup project directory
setup_project() {
    echo "📁 Setting up project directory..."
    sudo mkdir -p $INSTALL_DIR
    sudo chown $USER:$USER $INSTALL_DIR
    
    if [ -d "$INSTALL_DIR/YATRA-SURAKSHA-BACKEND" ]; then
        echo "⚠️  Project directory exists. Backing up..."
        sudo mv $INSTALL_DIR/YATRA-SURAKSHA-BACKEND $INSTALL_DIR/YATRA-SURAKSHA-BACKEND.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    echo "✅ Project directory ready"
}

# Function to copy/clone project files
setup_project_files() {
    echo "📂 Setting up project files..."
    cd $INSTALL_DIR
    
    # If this script is being run from the project directory, copy files
    if [ -f "$(dirname $0)/../package.json" ]; then
        echo "📋 Copying project files from current directory..."
        cp -r "$(dirname $0)/.." ./YATRA-SURAKSHA-BACKEND
    else
        echo "📥 Please manually copy your project files to $INSTALL_DIR/YATRA-SURAKSHA-BACKEND"
        echo "Or run this script from within your project directory"
        exit 1
    fi
    
    echo "✅ Project files ready"
}

# Function to configure network
configure_network() {
    echo "⚙️  Configuring network for server IP: $SERVER_IP"
    cd $INSTALL_DIR/YATRA-SURAKSHA-BACKEND
    
    # Update connection profiles if they exist
    if [ -f "fabric-network/connection-profiles/connection-profile.json" ]; then
        sed -i "s/localhost/$SERVER_IP/g" fabric-network/connection-profiles/connection-profile.json
    fi
    
    # Create environment file
    cat > .env << EOF
CORE_PEER_TLS_ENABLED=true
CORE_PEER_LOCALMSPID=Org1MSP
CORE_PEER_TLS_ROOTCERT_FILE=/opt/fabric-samples/test-network-nano-bash/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
CORE_PEER_MSPCONFIGPATH=/opt/fabric-samples/test-network-nano-bash/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
CORE_PEER_ADDRESS=peer0.org1.example.com:7051
FABRIC_CFG_PATH=/opt/fabric-samples/config
CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com
PATH=/opt/fabric-samples/bin:\$PATH
SERVER_IP=$SERVER_IP
EOF
    
    echo "✅ Network configured"
}

# Function to install project dependencies
install_dependencies() {
    echo "📦 Installing project dependencies..."
    cd $INSTALL_DIR/YATRA-SURAKSHA-BACKEND
    npm install
    echo "✅ Dependencies installed"
}

# Function to setup firewall
setup_firewall() {
    echo "🔒 Setting up firewall..."
    
    if command_exists ufw; then
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 3000/tcp  # Backend API
        sudo ufw allow 3003/tcp  # Blockchain Interface
        sudo ufw allow 7051/tcp  # Peer
        sudo ufw allow 7054/tcp  # CA
        sudo ufw allow 9443/tcp  # Orderer
        sudo ufw --force enable
        echo "✅ Firewall configured"
    else
        echo "⚠️  UFW not available. Please configure firewall manually"
    fi
}

# Function to start blockchain network
start_network() {
    echo "🚀 Starting blockchain network..."
    cd /opt/fabric-samples/test-network-nano-bash
    
    # Start the nano test network
    ./network.sh start
    
    echo "✅ Blockchain network started"
}

# Function to deploy chaincode
deploy_chaincode() {
    echo "📦 Deploying chaincode..."
    cd /opt/fabric-samples/test-network-nano-bash
    
    # Source peer admin environment
    source ./peer1admin.sh
    
    # Copy chaincode
    cp -r $INSTALL_DIR/YATRA-SURAKSHA-BACKEND/fabric-network/chaincodes/digital-tourist-id.js ./
    
    # Package chaincode
    peer lifecycle chaincode package digital-tourist-id.tar.gz \
        --path ./digital-tourist-id.js \
        --lang node \
        --label digital-tourist-id_2.0
    
    # Install chaincode
    peer lifecycle chaincode install digital-tourist-id.tar.gz
    
    # Get package ID
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep digital-tourist-id_2.0 | cut -d' ' -f3 | cut -d',' -f1)
    
    # Approve chaincode
    peer lifecycle chaincode approveformyorg \
        -o 127.0.0.1:6050 \
        --channelID mychannel \
        --name digital-tourist-id \
        --version 2.0 \
        --package-id $PACKAGE_ID \
        --sequence 2
    
    # Commit chaincode
    peer lifecycle chaincode commit \
        -o 127.0.0.1:6050 \
        --channelID mychannel \
        --name digital-tourist-id \
        --version 2.0 \
        --sequence 2
    
    echo "✅ Chaincode deployed successfully"
}

# Function to start services
start_services() {
    echo "🔄 Starting services..."
    cd $INSTALL_DIR/YATRA-SURAKSHA-BACKEND
    
    # Source environment
    source .env
    
    # Start pure blockchain interface
    echo "🔗 Starting blockchain interface on port 3003..."
    nohup node pure-blockchain-interface.js > logs/blockchain-interface.log 2>&1 &
    
    # Start main backend
    echo "🌐 Starting main backend on port 3000..."
    nohup npm start > logs/backend.log 2>&1 &
    
    echo "✅ Services started"
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Wait for services to start
    sleep 10
    
    # Check blockchain network
    cd /opt/fabric-samples/test-network-nano-bash
    source ./peer1admin.sh
    
    echo "📊 Checking channel info..."
    peer channel getinfo -c mychannel
    
    echo "🧪 Testing chaincode..."
    peer chaincode query -C mychannel -n digital-tourist-id -c '{"Args":["getAllTourists"]}'
    
    echo "🌐 Testing API endpoints..."
    curl -s http://localhost:3003/blockchain/status || echo "❌ Blockchain interface not responding"
    curl -s http://localhost:3000/api/health || echo "⚠️  Main backend not responding (may not have health endpoint)"
    
    echo "✅ Deployment verification complete"
}

# Function to create systemd services
create_systemd_services() {
    echo "🔧 Creating systemd services..."
    
    # Blockchain interface service
    sudo tee /etc/systemd/system/yatra-blockchain.service > /dev/null << EOF
[Unit]
Description=YATRA SURAKSHA Blockchain Interface
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/YATRA-SURAKSHA-BACKEND
Environment=NODE_ENV=production
Environment=CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com
ExecStart=/usr/bin/node pure-blockchain-interface.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Enable services
    sudo systemctl daemon-reload
    sudo systemctl enable yatra-blockchain
    
    echo "✅ Systemd services created"
}

# Main deployment function
main() {
    echo "🎯 Starting YATRA-SURAKSHA Blockchain Deployment"
    echo "📍 Target server: $SERVER_IP"
    echo "📁 Install directory: $INSTALL_DIR"
    echo ""
    
    # Create logs directory
    mkdir -p logs
    
    # Install prerequisites
    install_docker
    install_docker_compose
    install_nodejs
    install_go
    install_fabric
    
    # Setup project
    setup_project
    setup_project_files
    configure_network
    install_dependencies
    
    # Configure system
    setup_firewall
    
    # Deploy blockchain
    start_network
    deploy_chaincode
    
    # Start services
    start_services
    create_systemd_services
    
    # Verify deployment
    verify_deployment
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo ""
    echo "📋 Services:"
    echo "   🔗 Blockchain Interface: http://$SERVER_IP:3003"
    echo "   🌐 Backend API: http://$SERVER_IP:3000"
    echo ""
    echo "📁 Project location: $INSTALL_DIR/YATRA-SURAKSHA-BACKEND"
    echo "📊 View logs: tail -f $INSTALL_DIR/YATRA-SURAKSHA-BACKEND/logs/*.log"
    echo ""
    echo "🔧 Service management:"
    echo "   sudo systemctl start|stop|restart yatra-blockchain"
    echo "   sudo systemctl status yatra-blockchain"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   1. Configure domain name and SSL certificates"
    echo "   2. Set up monitoring and backups"
    echo "   3. Update DNS records"
    echo "   4. Configure load balancer if needed"
}

# Run main function
main "$@"