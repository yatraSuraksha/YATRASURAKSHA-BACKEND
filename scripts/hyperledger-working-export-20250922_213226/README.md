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
