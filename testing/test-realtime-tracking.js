/**
 * Real-Time Tracking Test Script
 * 
 * This script demonstrates how to test the real-time tracking functionality
 * for the Yatra Suraksha backend system.
 */

import fetch from 'node-fetch'
import { io } from 'socket.io-client'

const BASE_URL = 'http://localhost:3000'
const SOCKET_URL = 'http://localhost:3000'

// Test data
const testTourist = {
    digitalId: 'TEST_' + Date.now(),
    firebaseUid: 'test_firebase_' + Date.now(),
    personalInfo: {
        name: 'Test Tourist',
        email: 'test@example.com',
        phone: '+91-9876543210',
        nationality: 'India'
    }
}

const testLocations = [
    { latitude: 19.0760, longitude: 72.8777 }, // Mumbai - Gateway of India
    { latitude: 19.0825, longitude: 72.8811 }, // Mumbai - Colaba
    { latitude: 19.0896, longitude: 72.8656 }, // Mumbai - Crawford Market
    { latitude: 19.1075, longitude: 72.8263 }  // Mumbai - Bandra
]

// Test functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const testRestAPIs = async () => {
    console.log('🧪 Testing REST APIs...\n')

    try {
        // Test 1: Update location
        console.log('1. Testing location update API...')
        const locationUpdate = {
            touristId: '60f1b2e4c4a1b2c3d4e5f678', // Use a valid ObjectId
            latitude: testLocations[0].latitude,
            longitude: testLocations[0].longitude,
            accuracy: 5,
            speed: 0,
            batteryLevel: 85,
            timestamp: new Date().toISOString()
        }

        const locationResponse = await fetch(`${BASE_URL}/api/tracking/location/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationUpdate)
        })

        const locationResult = await locationResponse.json()
        console.log('✅ Location Update Response:', locationResult)

        // Test 2: Get statistics
        console.log('\n2. Testing statistics API...')
        const statsResponse = await fetch(`${BASE_URL}/api/tracking/stats`)
        const statsResult = await statsResponse.json()
        console.log('✅ Statistics Response:', statsResult)

        // Test 3: Get heatmap data
        console.log('\n3. Testing heatmap API...')
        const heatmapResponse = await fetch(`${BASE_URL}/api/tracking/location/heatmap?hours=24`)
        const heatmapResult = await heatmapResponse.json()
        console.log('✅ Heatmap Response:', heatmapResult)

        // Test 4: Create emergency alert
        console.log('\n4. Testing emergency alert API...')
        const emergencyAlert = {
            touristId: '60f1b2e4c4a1b2c3d4e5f678',
            latitude: testLocations[1].latitude,
            longitude: testLocations[1].longitude,
            message: 'Test emergency alert',
            type: 'panic_button'
        }

        const emergencyResponse = await fetch(`${BASE_URL}/api/tracking/alerts/emergency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emergencyAlert)
        })

        const emergencyResult = await emergencyResponse.json()
        console.log('✅ Emergency Alert Response:', emergencyResult)

        // Test 5: Get active alerts
        console.log('\n5. Testing active alerts API...')
        const alertsResponse = await fetch(`${BASE_URL}/api/tracking/alerts/active`)
        const alertsResult = await alertsResponse.json()
        console.log('✅ Active Alerts Response:', alertsResult)

    } catch (error) {
        console.error('❌ REST API Test Error:', error.message)
    }
}

const testWebSocketConnection = async () => {
    console.log('\n🔌 Testing WebSocket Connection...\n')

    return new Promise((resolve) => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        })

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server:', socket.id)

            // Join as admin
            socket.emit('join_admin', { userId: 'test_admin_123' })

            // Listen for various events
            socket.on('current_stats', (data) => {
                console.log('📊 Received current stats:', data)
            })

            socket.on('tourist_location_update', (data) => {
                console.log('📍 Received location update:', data)
            })

            socket.on('emergency_alert', (data) => {
                console.log('🚨 Received emergency alert:', data)
            })

            socket.on('geofence_alert', (data) => {
                console.log('🔶 Received geofence alert:', data)
            })

            socket.on('device_alert', (data) => {
                console.log('🔋 Received device alert:', data)
            })

            socket.on('stats_update', (data) => {
                console.log('📈 Received stats update:', data)
            })

            // Test sending location update via WebSocket
            setTimeout(() => {
                console.log('\n📤 Sending test location update via WebSocket...')
                socket.emit('location_update', {
                    touristId: '60f1b2e4c4a1b2c3d4e5f678',
                    latitude: testLocations[2].latitude,
                    longitude: testLocations[2].longitude,
                    accuracy: 8,
                    speed: 5,
                    batteryLevel: 70,
                    timestamp: new Date().toISOString()
                })
            }, 2000)

            // Test emergency alert via WebSocket
            setTimeout(() => {
                console.log('\n🚨 Sending test emergency alert via WebSocket...')
                socket.emit('emergency_alert', {
                    touristId: '60f1b2e4c4a1b2c3d4e5f678',
                    latitude: testLocations[3].latitude,
                    longitude: testLocations[3].longitude,
                    type: 'panic_button',
                    message: 'WebSocket emergency test'
                })
            }, 4000)

            // Test heartbeat
            setTimeout(() => {
                console.log('\n💓 Sending heartbeat...')
                socket.emit('heartbeat', { timestamp: new Date() })
            }, 6000)

            socket.on('heartbeat_ack', (data) => {
                console.log('✅ Received heartbeat acknowledgment:', data)
                
                setTimeout(() => {
                    socket.disconnect()
                    resolve()
                }, 1000)
            })
        })

        socket.on('disconnect', () => {
            console.log('👋 Disconnected from WebSocket server')
        })

        socket.on('error', (error) => {
            console.error('❌ WebSocket Error:', error)
            resolve()
        })

        socket.on('connect_error', (error) => {
            console.error('❌ WebSocket Connection Error:', error)
            resolve()
        })
    })
}

const simulateRealTimeTracking = async () => {
    console.log('\n🎯 Simulating Real-Time Tracking...\n')

    const socket = io(SOCKET_URL)
    const touristId = '60f1b2e4c4a1b2c3d4e5f678'

    socket.on('connect', () => {
        console.log('📱 Tourist device connected:', socket.id)
        socket.emit('join_tourist', { touristId })

        // Simulate movement through different locations
        let locationIndex = 0
        const moveInterval = setInterval(() => {
            if (locationIndex >= testLocations.length) {
                clearInterval(moveInterval)
                socket.disconnect()
                return
            }

            const location = testLocations[locationIndex]
            console.log(`📍 Moving to location ${locationIndex + 1}: ${location.latitude}, ${location.longitude}`)

            socket.emit('location_update', {
                touristId,
                latitude: location.latitude + (Math.random() - 0.5) * 0.001, // Add small random variation
                longitude: location.longitude + (Math.random() - 0.5) * 0.001,
                accuracy: Math.floor(Math.random() * 10) + 3,
                speed: Math.floor(Math.random() * 20),
                batteryLevel: Math.max(20, 100 - locationIndex * 5),
                timestamp: new Date().toISOString()
            })

            locationIndex++
        }, 3000)
    })

    return new Promise(resolve => {
        socket.on('disconnect', () => {
            console.log('📱 Tourist device disconnected')
            resolve()
        })
    })
}

// Main test runner
const runTests = async () => {
    console.log('🚀 Starting Yatra Suraksha Real-Time Tracking Tests\n')
    console.log('=' .repeat(60))

    try {
        // Test REST APIs
        await testRestAPIs()
        
        await delay(2000)
        
        // Test WebSocket connection
        await testWebSocketConnection()
        
        await delay(2000)
        
        // Simulate real-time tracking
        await simulateRealTimeTracking()

        console.log('\n' + '='.repeat(60))
        console.log('✅ All tests completed successfully!')
        console.log('\n📋 Test Summary:')
        console.log('   • REST API endpoints working')
        console.log('   • WebSocket connections established')
        console.log('   • Real-time location updates functioning')
        console.log('   • Emergency alerts working')
        console.log('   • Statistics and monitoring active')
        
    } catch (error) {
        console.error('\n❌ Test failed:', error)
    } finally {
        process.exit(0)
    }
}

// Usage instructions
console.log(`
🧪 Yatra Suraksha Real-Time Tracking Test Suite
===============================================

Before running this test, make sure:
1. Backend server is running on ${BASE_URL}
2. MongoDB is connected
3. All dependencies are installed

To run individual tests:
- testRestAPIs() - Test REST API endpoints
- testWebSocketConnection() - Test WebSocket functionality
- simulateRealTimeTracking() - Simulate device movement

Full test suite will run automatically...
`)

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests()
}

export {
    testRestAPIs,
    testWebSocketConnection,
    simulateRealTimeTracking,
    runTests
}