#!/bin/bash

# =============================================================================
# Yatra Suraksha Backend API Test Script
# Tests location tracking, movement simulation, and geofence creation
# All locations are in India (Guwahati, Assam region)
# =============================================================================

# Configuration
BASE_URL="http://4.186.25.99:3000/api"
# Replace with your actual tourist ID from the database
TOURIST_ID="69585275bec5fcee984a051c"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Yatra Suraksha Backend API Test Script   ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# =============================================================================
# 1. HEALTH CHECK
# =============================================================================
echo -e "${YELLOW}[1/10] Testing Health Check...${NC}"
curl -s -X GET "${BASE_URL}/health" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 2. GET ALL TOURISTS
# =============================================================================
echo -e "${YELLOW}[2/10] Getting All Tourists...${NC}"
curl -s -X GET "${BASE_URL}/tracking/tourists/all" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 3. GET TRACKING STATS
# =============================================================================
echo -e "${YELLOW}[3/10] Getting Tracking Stats...${NC}"
curl -s -X GET "${BASE_URL}/tracking/stats" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 4. SIMULATE TOURIST MOVEMENT IN GUWAHATI, ASSAM
# Starting from Kamakhya Temple and moving through the city
# =============================================================================
echo -e "${YELLOW}[4/10] Simulating Tourist Movement in Guwahati...${NC}"
echo -e "${GREEN}Starting location: Kamakhya Temple${NC}"

# Location 1: Kamakhya Temple (Starting Point)
echo -e "  📍 Location 1: Kamakhya Temple"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.1665,
    "longitude": 91.7086,
    "accuracy": 5,
    "speed": 0,
    "heading": 0,
    "altitude": 56,
    "batteryLevel": 95,
    "source": "gps"
  }' | jq .
sleep 2

# Location 2: Umananda Temple (Island in Brahmaputra)
echo -e "  📍 Location 2: Umananda Temple"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.1878,
    "longitude": 91.7437,
    "accuracy": 8,
    "speed": 2.5,
    "heading": 45,
    "altitude": 48,
    "batteryLevel": 92,
    "source": "gps"
  }' | jq .
sleep 2

# Location 3: Assam State Museum
echo -e "  📍 Location 3: Assam State Museum"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.1751,
    "longitude": 91.7553,
    "accuracy": 6,
    "speed": 5.0,
    "heading": 90,
    "altitude": 52,
    "batteryLevel": 88,
    "source": "gps"
  }' | jq .
sleep 2

# Location 4: Fancy Bazaar (Shopping Area)
echo -e "  📍 Location 4: Fancy Bazaar"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.1827,
    "longitude": 91.7478,
    "accuracy": 10,
    "speed": 1.5,
    "heading": 180,
    "altitude": 50,
    "batteryLevel": 85,
    "source": "gps"
  }' | jq .
sleep 2

# Location 5: Pobitora Wildlife Sanctuary (Outside city - longer trip)
echo -e "  📍 Location 5: Pobitora Wildlife Sanctuary"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.2167,
    "longitude": 92.0500,
    "accuracy": 15,
    "speed": 40.0,
    "heading": 75,
    "altitude": 45,
    "batteryLevel": 78,
    "source": "gps"
  }' | jq .
echo ""

# =============================================================================
# 5. GET LOCATION HISTORY
# =============================================================================
echo -e "${YELLOW}[5/10] Getting Location History for Tourist...${NC}"
curl -s -X GET "${BASE_URL}/tracking/location/history/${TOURIST_ID}?limit=10&hours=24" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 6. GET CURRENT LOCATION
# =============================================================================
echo -e "${YELLOW}[6/10] Getting Current Location...${NC}"
curl -s -X GET "${BASE_URL}/tracking/location/current/${TOURIST_ID}" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 7. CREATE GEOFENCES (Various types in Guwahati region)
# =============================================================================
echo -e "${YELLOW}[7/10] Creating Geofences in Guwahati Region...${NC}"

# Geofence 1: Safe Zone - Kamakhya Temple Area
echo -e "  🛡️ Creating Safe Zone: Kamakhya Temple"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kamakhya Temple Safe Zone",
    "description": "Safe tourist area around Kamakhya Temple with security presence",
    "type": "safe",
    "geometry": {
      "type": "Circle",
      "coordinates": [91.7086, 26.1665],
      "radius": 500
    },
    "riskLevel": 1,
    "alertMessage": {
      "english": "Welcome to Kamakhya Temple - A safe tourist zone",
      "hindi": "कामाख्या मंदिर में आपका स्वागत है - एक सुरक्षित पर्यटन क्षेत्र",
      "assamese": "কামাখ্যা মন্দিৰলৈ আপোনাক স্বাগতম - এক সুৰক্ষিত পৰ্যটন এলেকা"
    },
    "isActive": true
  }' | jq .
echo ""

# Geofence 2: Tourist Spot - Umananda Temple
echo -e "  📍 Creating Tourist Spot: Umananda Temple"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Umananda Temple Island",
    "description": "Peacock Island in Brahmaputra River - Boat access only",
    "type": "tourist_spot",
    "geometry": {
      "type": "Circle",
      "coordinates": [91.7437, 26.1878],
      "radius": 200
    },
    "riskLevel": 3,
    "alertMessage": {
      "english": "Umananda Temple - Take registered boats only. Water safety alert active.",
      "hindi": "उमानंद मंदिर - केवल पंजीकृत नावों से जाएं। जल सुरक्षा चेतावनी सक्रिय।",
      "assamese": "উমানন্দ মন্দিৰ - কেৱল পঞ্জীয়নভুক্ত নাও ব্যৱহাৰ কৰক।"
    },
    "isActive": true
  }' | jq .
echo ""

# Geofence 3: Warning Zone - Brahmaputra River Bank
echo -e "  ⚠️ Creating Warning Zone: Brahmaputra River Bank"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brahmaputra River Bank Warning Zone",
    "description": "River bank area - Strong currents during monsoon",
    "type": "warning",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [91.7200, 26.1900],
        [91.7600, 26.1900],
        [91.7600, 26.1950],
        [91.7200, 26.1950],
        [91.7200, 26.1900]
      ]]
    },
    "riskLevel": 6,
    "alertMessage": {
      "english": "Warning: Brahmaputra River Bank - Strong currents. Do not swim.",
      "hindi": "चेतावनी: ब्रह्मपुत्र नदी तट - तेज धारा। तैराकी न करें।",
      "assamese": "সাৱধান: ব্ৰহ্মপুত্ৰ নদীৰ পাৰ - প্ৰবল সোঁত। সাঁতুৰিব নালাগে।"
    },
    "isActive": true
  }' | jq .
echo ""

# Geofence 4: Danger Zone - Restricted Forest Area
echo -e "  🚫 Creating Danger Zone: Restricted Forest Area"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pobitora Core Wildlife Zone",
    "description": "Restricted wildlife sanctuary core area - No tourist entry",
    "type": "danger",
    "geometry": {
      "type": "Circle",
      "coordinates": [92.0600, 26.2300],
      "radius": 2000
    },
    "riskLevel": 9,
    "alertMessage": {
      "english": "DANGER: Core wildlife zone. Wild rhinos present. Entry prohibited.",
      "hindi": "खतरा: मुख्य वन्यजीव क्षेत्र। जंगली गैंडे मौजूद। प्रवेश निषेध।",
      "assamese": "বিপদ: মূল বন্যপ্ৰাণী এলেকা। বনৰীয়া গঁড় আছে। প্ৰৱেশ নিষিদ্ধ।"
    },
    "isActive": true
  }' | jq .
echo ""

# Geofence 5: Accommodation Zone - Paltan Bazaar Hotels
echo -e "  🏨 Creating Accommodation Zone: Paltan Bazaar"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paltan Bazaar Hotel District",
    "description": "Main tourist accommodation area with verified hotels",
    "type": "accommodation",
    "geometry": {
      "type": "Circle",
      "coordinates": [91.7524, 26.1773],
      "radius": 800
    },
    "riskLevel": 2,
    "alertMessage": {
      "english": "Paltan Bazaar - Tourist accommodation zone. Use verified hotels only.",
      "hindi": "पलटन बाजार - पर्यटक आवास क्षेत्र। केवल सत्यापित होटल उपयोग करें।",
      "assamese": "পল্টন বজাৰ - পৰ্যটক থকাৰ ঠাই। কেৱল প্ৰমাণিত হোটেল ব্যৱহাৰ কৰক।"
    },
    "isActive": true
  }' | jq .
echo ""

# Geofence 6: Emergency Services - GNB Hospital
echo -e "  🏥 Creating Emergency Services Zone: GNB Hospital"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gauhati Medical College Hospital",
    "description": "Major government hospital with emergency services",
    "type": "emergency_services",
    "geometry": {
      "type": "Circle",
      "coordinates": [91.7748, 26.1757],
      "radius": 300
    },
    "riskLevel": 1,
    "alertMessage": {
      "english": "Gauhati Medical College - Emergency services available 24/7",
      "hindi": "गौहाटी मेडिकल कॉलेज - 24/7 आपातकालीन सेवाएं उपलब्ध",
      "assamese": "গুৱাহাটী মেডিকেল কলেজ - ২৪/৭ জৰুৰীকালীন সেৱা উপলব্ধ"
    },
    "isActive": true
  }' | jq .
echo ""

# =============================================================================
# 8. GET ALL GEOFENCES
# =============================================================================
echo -e "${YELLOW}[8/10] Getting All Geofences...${NC}"
curl -s -X GET "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# 9. CREATE AN EMERGENCY ALERT
# =============================================================================
echo -e "${YELLOW}[9/10] Creating Emergency Alert...${NC}"
curl -s -X POST "${BASE_URL}/tracking/alerts/emergency" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 26.2000,
    "longitude": 91.7800,
    "message": "Tourist needs assistance near Brahmaputra River",
    "type": "panic_button",
    "severity": "high"
  }' | jq .
echo ""

# =============================================================================
# 10. GET ALL ACTIVE ALERTS
# =============================================================================
echo -e "${YELLOW}[10/10] Getting All Active Alerts...${NC}"
curl -s -X GET "${BASE_URL}/tracking/alerts/active" \
  -H "accept: application/json" | jq .
echo ""

# =============================================================================
# ADDITIONAL: More Movement Simulation (Delhi to Agra journey)
# =============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   BONUS: Simulating Delhi to Agra Trip    ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Starting Point: India Gate, Delhi
echo -e "  📍 Delhi: India Gate"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 28.6129,
    "longitude": 77.2295,
    "accuracy": 5,
    "speed": 0,
    "heading": 180,
    "altitude": 216,
    "batteryLevel": 100,
    "source": "gps"
  }' | jq .
sleep 1

# Midpoint: Mathura
echo -e "  📍 Mathura: Krishna Janmabhoomi"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 27.4924,
    "longitude": 77.6737,
    "accuracy": 8,
    "speed": 80.0,
    "heading": 180,
    "altitude": 170,
    "batteryLevel": 75,
    "source": "gps"
  }' | jq .
sleep 1

# Destination: Taj Mahal, Agra
echo -e "  📍 Agra: Taj Mahal"
curl -s -X POST "${BASE_URL}/tracking/location/update" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "touristId": "'"${TOURIST_ID}"'",
    "latitude": 27.1751,
    "longitude": 78.0421,
    "accuracy": 3,
    "speed": 0,
    "heading": 0,
    "altitude": 171,
    "batteryLevel": 60,
    "source": "gps"
  }' | jq .
echo ""

# Create Taj Mahal Safe Zone Geofence
echo -e "  🛡️ Creating Safe Zone: Taj Mahal"
curl -s -X POST "${BASE_URL}/tracking/geofences" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Taj Mahal Heritage Zone",
    "description": "UNESCO World Heritage Site - Highly secured tourist area",
    "type": "safe",
    "geometry": {
      "type": "Circle",
      "coordinates": [78.0421, 27.1751],
      "radius": 1000
    },
    "riskLevel": 1,
    "alertMessage": {
      "english": "Welcome to Taj Mahal - World Heritage Site. Security personnel available.",
      "hindi": "ताज महल में आपका स्वागत है - विश्व धरोहर स्थल। सुरक्षा कर्मी उपलब्ध।"
    },
    "isActive": true
  }' | jq .
echo ""

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}              TEST COMPLETE!               ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}✓ Health check completed${NC}"
echo -e "${GREEN}✓ Tourist data retrieved${NC}"
echo -e "${GREEN}✓ Location updates sent (Guwahati tour)${NC}"
echo -e "${GREEN}✓ Location history retrieved${NC}"
echo -e "${GREEN}✓ Geofences created (6 zones in Guwahati)${NC}"
echo -e "${GREEN}✓ Emergency alert created${NC}"
echo -e "${GREEN}✓ Delhi to Agra trip simulated${NC}"
echo -e "${GREEN}✓ Taj Mahal geofence created${NC}"
echo ""
echo -e "${YELLOW}To dismiss an alert, use:${NC}"
echo -e "curl -X POST '${BASE_URL}/tracking/alerts/acknowledge/{ALERT_ID}' -H 'Content-Type: application/json'"
echo ""
echo -e "${YELLOW}To delete a geofence, use:${NC}"
echo -e "curl -X DELETE '${BASE_URL}/tracking/geofences/{FENCE_ID}'"
echo ""
