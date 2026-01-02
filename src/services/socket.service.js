import { LocationHistory, Alert, Device } from '../models/tracking.model.js'
import Tourist from '../models/tourist.model.js'
import blockchainClientService from './blockchain-client.service.js'
import GeoFence from '../models/geoFence.model.js'
import geolib from 'geolib'

let connectedClients = new Map()
let adminClients = new Set()
let touristClients = new Map() 

export const initializeSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`)
        connectedClients.set(socket.id, {
            type: 'unknown',
            connectedAt: new Date(),
            lastActivity: new Date()
        })
        socket.on('join_admin', (data) => {
            console.log(`👨‍💼 Admin joined: ${socket.id}`)
            adminClients.add(socket.id)
            connectedClients.set(socket.id, {
                type: 'admin',
                userId: data.userId,
                connectedAt: new Date(),
                lastActivity: new Date()
            })
            
            
            sendCurrentStatsToAdmin(socket)
        })
        socket.on('join_tourist', (data) => {
            console.log(`🚶‍♂️ Tourist joined: ${socket.id}, ID: ${data.touristId}`)
            touristClients.set(data.touristId, socket.id)
            connectedClients.set(socket.id, {
                type: 'tourist',
                touristId: data.touristId,
                connectedAt: new Date(),
                lastActivity: new Date()
            })
        })
        socket.on('location_update', async (data) => {
            try {
                await handleLocationUpdate(data, socket.id, io)
            } catch (error) {
                console.error('Error handling location update:', error)
                socket.emit('error', { message: 'Failed to process location update' })
            }
        })
        socket.on('emergency_alert', async (data) => {
            try {
                await handleEmergencyAlert(data, socket.id, io)
            } catch (error) {
                console.error('Error handling emergency alert:', error)
                socket.emit('error', { message: 'Failed to process emergency alert' })
            }
        })
        socket.on('device_status', async (data) => {
            try {
                await handleDeviceStatus(data, socket.id, io)
            } catch (error) {
                console.error('Error handling device status:', error)
            }
        })
        socket.on('heartbeat', (data) => {
            const client = connectedClients.get(socket.id)
            if (client) {
                client.lastActivity = new Date()
                connectedClients.set(socket.id, client)
            }
            socket.emit('heartbeat_ack', { timestamp: new Date() })
        })
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`)
            const client = connectedClients.get(socket.id)
            
            if (client) {
                if (client.type === 'admin') {
                    adminClients.delete(socket.id)
                } else if (client.type === 'tourist' && client.touristId) {
                    touristClients.delete(client.touristId)
                }
            }
            
            // Remove from all family groups
            removeFromAllFamilyGroups(socket.id)
            
            connectedClients.delete(socket.id)
        })

        // Family tracking socket events
        socket.on('join_family_group', async (data) => {
            try {
                const { groupId, touristId } = data
                if (!groupId) {
                    socket.emit('error', { message: 'Group ID is required' })
                    return
                }
                
                joinFamilyGroup(socket.id, groupId)
                console.log(`👨‍👩‍👧‍👦 Tourist ${touristId} joined family group: ${groupId}`)
                
                socket.emit('family_group_joined', { 
                    groupId, 
                    message: 'Successfully joined family group for real-time updates' 
                })
            } catch (error) {
                console.error('Error joining family group:', error)
                socket.emit('error', { message: 'Failed to join family group' })
            }
        })

        socket.on('leave_family_group', (data) => {
            const { groupId } = data
            if (groupId) {
                leaveFamilyGroup(socket.id, groupId)
                console.log(`👨‍👩‍👧‍👦 Socket ${socket.id} left family group: ${groupId}`)
            }
        })

        socket.on('family_location_update', async (data) => {
            try {
                await handleFamilyLocationUpdate(data, socket.id, io)
            } catch (error) {
                console.error('Error handling family location update:', error)
                socket.emit('error', { message: 'Failed to process family location update' })
            }
        })

        socket.on('family_sos', async (data) => {
            try {
                await handleFamilySOS(data, socket.id, io)
            } catch (error) {
                console.error('Error handling family SOS:', error)
                socket.emit('error', { message: 'Failed to process family SOS' })
            }
        })

        socket.on('family_check_in_response', async (data) => {
            try {
                await handleFamilyCheckInResponse(data, socket.id, io)
            } catch (error) {
                console.error('Error handling check-in response:', error)
            }
        })
    })
    setInterval(() => {
        broadcastStatsToAdmins(io)
    }, 30000) 
    setInterval(() => {
        checkInactiveDevices(io)
    }, 300000) 
}

// Family tracking helper - track family group clients
let familyGroupClients = new Map()

const joinFamilyGroup = (socketId, groupId) => {
    if (!familyGroupClients.has(groupId.toString())) {
        familyGroupClients.set(groupId.toString(), new Set())
    }
    familyGroupClients.get(groupId.toString()).add(socketId)
}

const leaveFamilyGroup = (socketId, groupId) => {
    const groupMembers = familyGroupClients.get(groupId.toString())
    if (groupMembers) {
        groupMembers.delete(socketId)
        if (groupMembers.size === 0) {
            familyGroupClients.delete(groupId.toString())
        }
    }
}

const removeFromAllFamilyGroups = (socketId) => {
    familyGroupClients.forEach((members, groupId) => {
        members.delete(socketId)
        if (members.size === 0) {
            familyGroupClients.delete(groupId)
        }
    })
}

/**
 * Handle location updates shared with family groups
 */
const handleFamilyLocationUpdate = async (data, socketId, io) => {
    const { touristId, groupIds, latitude, longitude, accuracy, batteryLevel } = data
    
    if (!touristId || !latitude || !longitude || !groupIds || !Array.isArray(groupIds)) {
        throw new Error('Missing required data for family location update')
    }

    const tourist = await Tourist.findById(touristId).select('personalInfo.name digitalId')
    if (!tourist) {
        throw new Error('Tourist not found')
    }

    const locationData = {
        touristId,
        name: tourist.personalInfo?.name || 'Unknown',
        digitalId: tourist.digitalId,
        location: {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date()
        },
        batteryLevel,
        isOnline: true
    }

    // Broadcast to all specified family groups
    for (const groupId of groupIds) {
        const groupMembers = familyGroupClients.get(groupId.toString())
        if (groupMembers) {
            groupMembers.forEach(memberSocketId => {
                if (memberSocketId !== socketId) { // Don't send to self
                    io.to(memberSocketId).emit('family_member_location', {
                        groupId,
                        ...locationData
                    })
                }
            })
        }
    }

    console.log(`📍 Family location update from ${tourist.personalInfo?.name} to ${groupIds.length} groups`)
}

/**
 * Handle SOS alerts to family groups
 */
const handleFamilySOS = async (data, socketId, io) => {
    const { touristId, groupIds, latitude, longitude, message, alertType = 'sos' } = data
    
    if (!touristId || !groupIds || !Array.isArray(groupIds)) {
        throw new Error('Missing required data for family SOS')
    }

    const tourist = await Tourist.findById(touristId).select('personalInfo.name digitalId')
    if (!tourist) {
        throw new Error('Tourist not found')
    }

    const sosData = {
        alertId: `SOS-${Date.now()}-${touristId.toString().slice(-6)}`,
        touristId,
        name: tourist.personalInfo?.name || 'Unknown',
        digitalId: tourist.digitalId,
        alertType,
        severity: alertType === 'sos' || alertType === 'emergency' ? 'critical' : 'high',
        message: message || `${tourist.personalInfo?.name || 'A family member'} needs help!`,
        location: latitude && longitude ? { latitude, longitude } : null,
        timestamp: new Date()
    }

    // Broadcast SOS to all specified family groups
    for (const groupId of groupIds) {
        const groupMembers = familyGroupClients.get(groupId.toString())
        if (groupMembers) {
            groupMembers.forEach(memberSocketId => {
                io.to(memberSocketId).emit('family_sos_alert', {
                    groupId,
                    ...sosData
                })
            })
        }
    }

    console.log(`🚨 Family SOS from ${tourist.personalInfo?.name} sent to ${groupIds.length} groups`)
}

/**
 * Handle check-in responses from family members
 */
const handleFamilyCheckInResponse = async (data, socketId, io) => {
    const { touristId, groupId, alertId, response, latitude, longitude } = data
    
    if (!touristId || !groupId || !alertId) {
        throw new Error('Missing required data for check-in response')
    }

    const tourist = await Tourist.findById(touristId).select('personalInfo.name digitalId')
    if (!tourist) {
        throw new Error('Tourist not found')
    }

    const checkInData = {
        alertId,
        touristId,
        name: tourist.personalInfo?.name || 'Unknown',
        response: response || 'I am safe',
        location: latitude && longitude ? { latitude, longitude } : null,
        timestamp: new Date()
    }

    // Broadcast check-in response to the family group
    const groupMembers = familyGroupClients.get(groupId.toString())
    if (groupMembers) {
        groupMembers.forEach(memberSocketId => {
            io.to(memberSocketId).emit('family_check_in_received', {
                groupId,
                ...checkInData
            })
        })
    }

    console.log(`✅ Check-in response from ${tourist.personalInfo?.name} in group ${groupId}`)
}

const handleLocationUpdate = async (data, socketId, io) => {
    const { touristId, latitude, longitude, accuracy, timestamp, speed, heading, altitude, batteryLevel, source } = data
    if (!touristId || !latitude || !longitude) {
        throw new Error('Missing required location data')
    }
    const locationRecord = new LocationHistory({
        touristId,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude] 
        },
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        accuracy: accuracy || 10,
        speed: speed || 0,
        heading: heading || 0,
        altitude: altitude || 0,
        batteryLevel: batteryLevel || 100,
        source: source || 'gps'
    })

    await locationRecord.save()
    await Tourist.findByIdAndUpdate(touristId, {
        currentLocation: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        lastLocationUpdate: new Date(),
        isActive: true
    })
    await checkGeofences(touristId, latitude, longitude, io)
    const locationUpdate = {
        touristId,
        latitude,
        longitude,
        accuracy,
        timestamp: locationRecord.timestamp,
        speed,
        batteryLevel
    }

    broadcastToAdmins(io, 'tourist_location_update', locationUpdate)

    console.log(`📍 Location updated for tourist ${touristId}: ${latitude}, ${longitude}`)
}
const handleEmergencyAlert = async (data, socketId, io) => {
    const { touristId, latitude, longitude, type, message } = data
    const alert = new Alert({
        alertId: `emergency_${Date.now()}_${touristId}`,
        touristId,
        type: type || 'panic_button',
        severity: 'emergency',
        message: {
            english: message || 'Emergency alert triggered',
            hindi: 'आपातकालीन अलर्ट सक्रिय'
        },
        location: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        metadata: {
            triggeredBy: 'user',
            source: 'mobile_app'
        }
    })

    await alert.save()
    
    // Log emergency incident to blockchain for immutable record
    try {
        const tourist = await Tourist.findById(touristId);
        if (tourist?.blockchainDID) {
            const incidentData = {
                touristDID: tourist.blockchainDID,
                type: type || 'panic_button',
                severity: 'critical',
                location: {
                    lat: latitude,
                    lng: longitude
                },
                description: message || 'Emergency alert triggered via mobile app',
                status: 'reported',
                reportedBy: 'tourist',
                alertId: alert.alertId,
                metadata: {
                    triggeredBy: 'user',
                    source: 'mobile_app',
                    socketId: socketId
                }
            };
            
            // Fire and forget - don't block the socket response
            blockchainClientService.logIncident(incidentData).then(result => {
                if (result.success) {
                    console.log(`✅ Socket emergency incident logged to blockchain: ${result.txId}`);
                }
            }).catch(error => {
                console.warn('⚠️ Failed to log socket emergency incident to blockchain:', error.message);
            });
        }
        
        await Tourist.findByIdAndUpdate(touristId, {
            status: 'emergency',
            lastEmergencyAlert: new Date()
        })
    } catch (error) {
        console.error('Error handling emergency alert blockchain logging:', error);
    }
    const emergencyData = {
        alertId: alert.alertId,
        touristId,
        type: alert.type,
        severity: alert.severity,
        location: { latitude, longitude },
        timestamp: alert.createdAt,
        message: alert.message.english
    }

    broadcastToAdmins(io, 'emergency_alert', emergencyData)

    console.log(`🚨 Emergency alert from tourist ${touristId} at ${latitude}, ${longitude}`)
}
const handleDeviceStatus = async (data, socketId, io) => {
    const { deviceId, touristId, batteryLevel, signalStrength, isCharging, temperature } = data

    await Device.findOneAndUpdate(
        { deviceId },
        {
            touristId,
            status: batteryLevel < 20 ? 'low_battery' : 'active',
            'currentMetrics.batteryLevel': batteryLevel,
            'currentMetrics.signalStrength': signalStrength,
            'currentMetrics.isCharging': isCharging,
            'currentMetrics.temperature': temperature,
            'currentMetrics.lastPing': new Date()
        },
        { upsert: true }
    )
    if (batteryLevel < 20) {
        const alert = new Alert({
            alertId: `battery_${Date.now()}_${touristId}`,
            touristId,
            type: 'battery_low',
            severity: 'warning',
            message: {
                english: `Device battery is low: ${batteryLevel}%`,
                hindi: `डिवाइस की बैटरी कम है: ${batteryLevel}%`
            },
            metadata: {
                actualValue: batteryLevel,
                thresholdValue: 20
            }
        })

        await alert.save()
        broadcastToAdmins(io, 'device_alert', {
            alertId: alert.alertId,
            touristId,
            type: 'battery_low',
            batteryLevel,
            timestamp: new Date()
        })
    }
}
const checkGeofences = async (touristId, latitude, longitude, io) => {
    try {
        const geoFences = await GeoFence.find({ isActive: true })
        
        for (const fence of geoFences) {
            let isInside = false
            if (fence.geometry.type === 'Polygon') {
                isInside = geolib.isPointInPolygon(
                    { latitude, longitude },
                    fence.geometry.coordinates[0].map(coord => ({
                        latitude: coord[1],
                        longitude: coord[0]
                    }))
                )
            } else if (fence.geometry.type === 'Circle') {
                const center = fence.geometry.coordinates
                const distance = geolib.getDistance(
                    { latitude, longitude },
                    { latitude: center[1], longitude: center[0] }
                )
                isInside = distance <= (fence.geometry.radius || 1000)
            }
            const lastAlert = await Alert.findOne({
                touristId,
                geoFenceId: fence._id,
                type: { $in: ['geofence_entry', 'geofence_exit'] }
            }).sort({ createdAt: -1 })

            const wasInside = lastAlert?.type === 'geofence_entry'

            if (isInside && !wasInside) {
                
                const alert = new Alert({
                    alertId: `geofence_entry_${Date.now()}_${touristId}`,
                    touristId,
                    type: 'geofence_entry',
                    severity: fence.type === 'danger' ? 'critical' : 'warning',
                    message: {
                        english: fence.alertMessage?.english || `Entered ${fence.name}`,
                        hindi: fence.alertMessage?.hindi || `${fence.name} में प्रवेश किया`
                    },
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    geoFenceId: fence._id
                })

                await alert.save()
                
                // Log critical geofence violations to blockchain
                if (fence.type === 'danger' || fence.riskLevel >= 8) {
                    try {
                        const tourist = await Tourist.findById(touristId);
                        if (tourist?.blockchainDID) {
                            const incidentData = {
                                touristDID: tourist.blockchainDID,
                                type: 'geofence_violation',
                                severity: fence.type === 'danger' ? 'critical' : 'high',
                                location: {
                                    lat: latitude,
                                    lng: longitude
                                },
                                description: `Tourist entered dangerous area: ${fence.name}`,
                                status: 'reported',
                                reportedBy: 'system',
                                alertId: alert.alertId,
                                metadata: {
                                    fenceName: fence.name,
                                    fenceType: fence.type,
                                    riskLevel: fence.riskLevel,
                                    detectionMethod: 'geofence_monitoring'
                                }
                            };
                            
                            // Fire and forget - don't block the socket response
                            blockchainClientService.logIncident(incidentData).then(result => {
                                if (result.success) {
                                    console.log(`✅ Critical geofence violation logged to blockchain: ${result.txId}`);
                                }
                            }).catch(error => {
                                console.warn('⚠️ Failed to log geofence violation to blockchain:', error.message);
                            });
                        }
                    } catch (error) {
                        console.error('Error handling geofence violation blockchain logging:', error);
                    }
                }
                
                broadcastToAdmins(io, 'geofence_alert', {
                    alertId: alert.alertId,
                    touristId,
                    type: 'entry',
                    fenceName: fence.name,
                    fenceType: fence.type,
                    severity: alert.severity,
                    location: { latitude, longitude },
                    timestamp: new Date()
                })
            } else if (!isInside && wasInside) {
                
                const alert = new Alert({
                    alertId: `geofence_exit_${Date.now()}_${touristId}`,
                    touristId,
                    type: 'geofence_exit',
                    severity: 'info',
                    message: {
                        english: `Exited ${fence.name}`,
                        hindi: `${fence.name} से बाहर निकला`
                    },
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    geoFenceId: fence._id
                })

                await alert.save()
                broadcastToAdmins(io, 'geofence_alert', {
                    alertId: alert.alertId,
                    touristId,
                    type: 'exit',
                    fenceName: fence.name,
                    fenceType: fence.type,
                    location: { latitude, longitude },
                    timestamp: new Date()
                })
            }
        }
    } catch (error) {
        console.error('Error checking geofences:', error)
    }
}
const sendCurrentStatsToAdmin = async (socket) => {
    try {
        const stats = await getCurrentStats()
        socket.emit('current_stats', stats)
    } catch (error) {
        console.error('Error sending current stats:', error)
    }
}
const broadcastStatsToAdmins = async (io) => {
    try {
        const stats = await getCurrentStats()
        broadcastToAdmins(io, 'stats_update', stats)
    } catch (error) {
        console.error('Error broadcasting stats:', error)
    }
}
const getCurrentStats = async () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
        totalTourists,
        activeTourists,
        emergencyAlerts,
        recentAlerts,
        connectedDevices
    ] = await Promise.all([
        Tourist.countDocuments(),
        Tourist.countDocuments({ isActive: true, lastLocationUpdate: { $gte: oneDayAgo } }),
        Alert.countDocuments({ severity: 'emergency', 'acknowledgment.isAcknowledged': false }),
        Alert.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        Device.countDocuments({ status: 'active', 'currentMetrics.lastPing': { $gte: oneDayAgo } })
    ])

    return {
        totalTourists,
        activeTourists,
        emergencyAlerts,
        recentAlerts,
        connectedDevices,
        connectedClients: connectedClients.size,
        adminClients: adminClients.size,
        timestamp: now
    }
}
const checkInactiveDevices = async (io) => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
        
        const inactiveDevices = await Device.find({
            status: 'active',
            'currentMetrics.lastPing': { $lt: thirtyMinutesAgo }
        }).populate('touristId')

        for (const device of inactiveDevices) {
            
            await Device.findByIdAndUpdate(device._id, { status: 'offline' })
            const alert = new Alert({
                alertId: `inactivity_${Date.now()}_${device.touristId._id}`,
                touristId: device.touristId._id,
                type: 'inactivity',
                severity: 'warning',
                message: {
                    english: `Tourist device has been inactive for 30+ minutes`,
                    hindi: 'पर्यटक का उपकरण 30+ मिनट से निष्क्रिय है'
                },
                metadata: {
                    deviceId: device.deviceId,
                    lastPing: device.currentMetrics.lastPing
                }
            })

            await alert.save()
            broadcastToAdmins(io, 'inactivity_alert', {
                alertId: alert.alertId,
                touristId: device.touristId._id,
                touristName: device.touristId.name,
                deviceId: device.deviceId,
                lastSeen: device.currentMetrics.lastPing,
                timestamp: new Date()
            })
        }
    } catch (error) {
        console.error('Error checking inactive devices:', error)
    }
}
const broadcastToAdmins = (io, event, data) => {
    adminClients.forEach(socketId => {
        io.to(socketId).emit(event, data)
    })
}

/**
 * Broadcast to all members of a family group
 */
export const broadcastToFamilyGroup = (io, groupId, event, data) => {
    const groupMembers = familyGroupClients.get(groupId.toString())
    if (groupMembers) {
        groupMembers.forEach(socketId => {
            io.to(socketId).emit(event, data)
        })
    }
}

/**
 * Notify specific family members
 */
export const notifyFamilyMembers = async (io, memberTouristIds, event, data) => {
    memberTouristIds.forEach(touristId => {
        const socketId = touristClients.get(touristId.toString())
        if (socketId) {
            io.to(socketId).emit(event, data)
        }
    })
}

export const getConnectedClientsInfo = () => {
    return {
        total: connectedClients.size,
        admins: adminClients.size,
        tourists: touristClients.size,
        familyGroups: familyGroupClients.size,
        clients: Array.from(connectedClients.entries()).map(([socketId, info]) => ({
            socketId,
            ...info
        }))
    }
}