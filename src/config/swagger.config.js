import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Yatra Suraksha API',
            version: '1.0.0',
            description: 'Authentication API for Yatra Suraksha Travel App',
        },
        tags: [
            {
                name: '🔐 Mobile App - Authentication',
                description: 'Firebase authentication endpoints for mobile app users'
            },
            {
                name: '📱 Mobile App - Profile Management',
                description: 'Tourist profile management endpoints for mobile app'
            },
            {
                name: '📱 Mobile App - Document Processing',
                description: 'OCR and document processing endpoints for mobile app'
            },
            {
                name: '📱 Mobile App - Location Tracking',
                description: 'Location tracking and history endpoints for mobile app'
            },
            {
                name: '📱 Mobile App - Statistics',
                description: 'Personal statistics and analytics for mobile app users'
            },
            {
                name: '📱 Mobile App - Device Management',
                description: 'Device management and connectivity for mobile app'
            },
            {
                name: '📱 Mobile App - Emergency Alerts',
                description: 'Emergency alert management for mobile app users'
            },
            {
                name: '🌐 Admin Website - Location Management',
                description: 'Admin endpoints for tourist location monitoring and management'
            },
            {
                name: '🌐 Admin Website - Analytics',
                description: 'Admin endpoints for data analytics and heatmaps'
            },
            {
                name: '🌐 Admin Website - Emergency Management',
                description: 'Admin endpoints for emergency alert management'
            },
            {
                name: '🌐 Admin Website - Geofencing',
                description: 'Admin endpoints for geofence creation and management'
            },
            {
                name: '🔧 System Health',
                description: 'System health monitoring and service status endpoints'
            },
            {
                name: '👨‍👩‍👧‍👦 Family Tracking',
                description: 'Family group management, real-time family location tracking, and family emergency alerts'
            },
            {
                name: '🗺️ Maps',
                description: 'Azure Maps API endpoints for geocoding, routing, POI search, and location services'
            },
            {
                name: '🎥 Video Management',
                description: 'Video upload, streaming, download, and management endpoints'
            }
        ],
        servers: [
            {
                url: '/',
                description: 'Current server (relative)',
            },
            {
                url: 'https://yatra-suraksha.n5n.live',
                description: 'Production server (HTTPS)',
            },
            {
                url: 'http://yatra-suraksha.n5n.live',
                description: 'Production server (HTTP)',
            },
            {
                url: 'http://yatra-suraksha.n5n.live:3000',
                description: 'Production server (Direct Port)',
            },
            {
                url: 'http://localhost:3000',
                description: 'Local development',
            },
        ],
        components: {
            securitySchemes: {
                FirebaseAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Firebase ID Token'
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Bearer Token'
                }
            },
            schemas: {
                
                User: {
                    type: 'object',
                    properties: {
                        uid: {
                            type: 'string',
                            description: 'Firebase user ID'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        name: {
                            type: 'string',
                            description: 'User display name'
                        },
                        picture: {
                            type: 'string',
                            format: 'uri',
                            description: 'User profile picture URL'
                        }
                    }
                },
                
                
                Tourist: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique tourist ID' },
                        digitalId: { type: 'string', description: 'Blockchain digital ID' },
                        firebaseUid: { type: 'string', description: 'Firebase authentication ID' },
                        personalInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                                phone: { type: 'string' },
                                nationality: { type: 'string' },
                                dateOfBirth: { type: 'string', format: 'date' },
                                gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
                            }
                        },
                        currentLocation: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } },
                                timestamp: { type: 'string', format: 'date-time' },
                                accuracy: { type: 'number' },
                                address: { type: 'string' }
                            }
                        },
                        safetyScore: { type: 'number', minimum: 0, maximum: 100 },
                        status: { type: 'string', enum: ['active', 'inactive', 'emergency', 'missing', 'safe'] },
                        checkInTime: { type: 'string', format: 'date-time' },
                        expectedCheckOutTime: { type: 'string', format: 'date-time' }
                    }
                },
                
                
                LocationHistory: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        deviceId: { type: 'string' },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        accuracy: { type: 'number' },
                        speed: { type: 'number' },
                        altitude: { type: 'number' },
                        heading: { type: 'number' },
                        batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
                        source: { type: 'string', enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'] }
                    }
                },
                
                
                Alert: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        alertId: { type: 'string', description: 'Unique alert identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        type: { type: 'string', enum: ['emergency', 'geofence_exit', 'geofence_enter', 'low_battery', 'device_offline', 'panic_button', 'anomaly_detected'] },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        message: { type: 'string' },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        acknowledgment: {
                            type: 'object',
                            properties: {
                                isAcknowledged: { type: 'boolean' },
                                acknowledgedBy: { type: 'string' },
                                acknowledgedAt: { type: 'string', format: 'date-time' },
                                response: { type: 'string' }
                            }
                        }
                    }
                },
                
                
                Device: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        deviceId: { type: 'string', description: 'Unique device identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        type: { type: 'string', enum: ['mobile', 'smart_band', 'iot_tag', 'beacon'] },
                        manufacturer: { type: 'string' },
                        model: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive', 'low_battery', 'offline', 'maintenance'] },
                        currentMetrics: {
                            type: 'object',
                            properties: {
                                batteryLevel: { type: 'number', minimum: 0, maximum: 100 },
                                signalStrength: { type: 'number' },
                                lastPing: { type: 'string', format: 'date-time' },
                                location: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['Point'] },
                                        coordinates: { type: 'array', items: { type: 'number' } }
                                    }
                                }
                            }
                        }
                    }
                },
                
                
                GeoFence: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'] },
                        geometry: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Polygon', 'Circle', 'Point'] },
                                coordinates: { type: 'array' },
                                radius: { type: 'number' }
                            }
                        },
                        riskLevel: { type: 'number', minimum: 1, maximum: 10 },
                        alertMessage: {
                            type: 'object',
                            properties: {
                                english: { type: 'string' },
                                hindi: { type: 'string' },
                                assamese: { type: 'string' },
                                bengali: { type: 'string' },
                                manipuri: { type: 'string' }
                            }
                        },
                        isActive: { type: 'boolean' },
                        createdBy: { type: 'string', description: 'Reference to User' }
                    }
                },
                
                
                Incident: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        incidentId: { type: 'string', description: 'Unique incident identifier' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        digitalId: { type: 'string', description: 'Reference to DigitalId' },
                        type: { type: 'string', enum: ['panic_button', 'anomaly_detected', 'missing_person', 'medical_emergency', 'geofence_violation', 'device_malfunction', 'weather_alert', 'manual_report'] },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        status: { type: 'string', enum: ['open', 'investigating', 'responding', 'resolved', 'closed', 'false_alarm'] },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } },
                                address: { type: 'string' },
                                landmark: { type: 'string' },
                                accuracy: { type: 'number' }
                            }
                        },
                        description: { type: 'string' },
                        response: {
                            type: 'object',
                            properties: {
                                evirNumber: { type: 'string', description: 'Electronic FIR number' },
                                assignedOfficer: { type: 'string', description: 'Reference to User' },
                                estimatedResponseTime: { type: 'number' },
                                actualResponseTime: { type: 'number' }
                            }
                        }
                    }
                },
                
                
                DigitalId: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        blockchainHash: { type: 'string', description: 'Blockchain transaction hash' },
                        qrCode: { type: 'string', description: 'QR code data' },
                        kycData: {
                            type: 'object',
                            properties: {
                                verified: { type: 'boolean' },
                                verificationDate: { type: 'string', format: 'date-time' },
                                verificationScore: { type: 'number', minimum: 0, maximum: 100 },
                                documents: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: { type: 'string', enum: ['aadhaar', 'passport', 'visa', 'driving_license', 'photo'] },
                                            documentNumber: { type: 'string' },
                                            verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
                                            verifiedBy: { type: 'string', description: 'Reference to User' },
                                            verificationDate: { type: 'string', format: 'date-time' },
                                            expiryDate: { type: 'string', format: 'date' }
                                        }
                                    }
                                }
                            }
                        },
                        isActive: { type: 'boolean' },
                        issuedDate: { type: 'string', format: 'date-time' },
                        expiryDate: { type: 'string', format: 'date-time' }
                    }
                },
                
                
                OCRResult: {
                    type: 'object',
                    properties: {
                        documentType: { type: 'string', enum: ['aadhaar', 'passport'] },
                        extractedInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                dob: { type: 'string' },
                                address: { type: 'string' },
                                phone: { type: 'string' },
                                documentNumber: { type: 'string' }
                            }
                        },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        extractedText: { type: 'string' }
                    }
                },
                
                
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        error: {
                            type: 'string',
                            example: 'Detailed error information'
                        }
                    }
                },
                
                
                DataResponse: {
                    type: 'object',
                    allOf: [
                        { $ref: '#/components/schemas/SuccessResponse' },
                        {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'object',
                                    description: 'Response data object'
                                }
                            }
                        }
                    ]
                },
                
                
                LocationUpdateRequest: {
                    type: 'object',
                    required: ['touristId', 'latitude', 'longitude'],
                    properties: {
                        touristId: { 
                            type: 'string', 
                            description: 'Tourist ID' 
                        },
                        latitude: { 
                            type: 'number', 
                            minimum: -90, 
                            maximum: 90,
                            description: 'Latitude coordinate'
                        },
                        longitude: { 
                            type: 'number', 
                            minimum: -180, 
                            maximum: 180,
                            description: 'Longitude coordinate'
                        },
                        accuracy: { 
                            type: 'number', 
                            description: 'GPS accuracy in meters (optional)' 
                        },
                        speed: { 
                            type: 'number', 
                            description: 'Speed in m/s (optional)' 
                        },
                        heading: { 
                            type: 'number', 
                            description: 'Direction in degrees (optional)' 
                        },
                        altitude: { 
                            type: 'number', 
                            description: 'Altitude in meters (optional)' 
                        },
                        batteryLevel: { 
                            type: 'number', 
                            minimum: 0, 
                            maximum: 100,
                            description: 'Battery level percentage (optional)'
                        },
                        source: { 
                            type: 'string', 
                            enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'],
                            description: 'Location source type (optional)'
                        }
                    },
                    example: {
                        touristId: "64f8a2b4c1d2e3f456789abc",
                        latitude: 26.1445,
                        longitude: 91.7362,
                        accuracy: 5.2,
                        speed: 2.5,
                        heading: 180,
                        altitude: 56,
                        batteryLevel: 85,
                        source: "gps"
                    }
                },
                
                
                GeofenceCreateRequest: {
                    type: 'object',
                    required: ['name', 'type', 'geometry'],
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'] },
                        geometry: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Polygon', 'Circle', 'Point'] },
                                coordinates: { type: 'array' },
                                radius: { type: 'number' }
                            }
                        },
                        riskLevel: { type: 'number', minimum: 1, maximum: 10 },
                        alertMessage: {
                            type: 'object',
                            properties: {
                                english: { type: 'string' },
                                hindi: { type: 'string' },
                                assamese: { type: 'string' },
                                bengali: { type: 'string' },
                                manipuri: { type: 'string' }
                            }
                        }
                    }
                },
                
                // ==================== FAMILY TRACKING SCHEMAS ====================
                FamilyGroup: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique family group ID' },
                        name: { type: 'string', description: 'Name of the family group' },
                        description: { type: 'string', description: 'Optional description' },
                        createdBy: { type: 'string', description: 'Tourist ID of the creator' },
                        inviteCode: { type: 'string', description: 'Current active invite code' },
                        inviteCodeExpiry: { type: 'string', format: 'date-time', description: 'Invite code expiration' },
                        memberCount: { type: 'integer', description: 'Number of members in the group' },
                        settings: {
                            type: 'object',
                            properties: {
                                allowMemberInvites: { type: 'boolean', default: false },
                                requireApprovalToJoin: { type: 'boolean', default: true },
                                shareLocationByDefault: { type: 'boolean', default: true },
                                notifyOnEmergency: { type: 'boolean', default: true }
                            }
                        },
                        isActive: { type: 'boolean', default: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                
                FamilyMember: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Member record ID' },
                        familyGroupId: { type: 'string', description: 'Reference to FamilyGroup' },
                        touristId: { type: 'string', description: 'Reference to Tourist' },
                        role: { 
                            type: 'string', 
                            enum: ['admin', 'guardian', 'member', 'child'],
                            description: 'Member role in the group'
                        },
                        nickname: { type: 'string', description: 'Display name in the group' },
                        relationship: { 
                            type: 'string', 
                            enum: ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'relative', 'friend', 'other']
                        },
                        status: { 
                            type: 'string', 
                            enum: ['active', 'pending', 'suspended'],
                            default: 'active'
                        },
                        settings: {
                            type: 'object',
                            properties: {
                                shareLocation: { type: 'boolean', default: true },
                                receiveAlerts: { type: 'boolean', default: true },
                                canViewOthersLocation: { type: 'boolean', default: true }
                            }
                        },
                        lastKnownLocation: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } },
                                timestamp: { type: 'string', format: 'date-time' },
                                accuracy: { type: 'number' },
                                batteryLevel: { type: 'number', minimum: 0, maximum: 100 }
                            }
                        },
                        joinedAt: { type: 'string', format: 'date-time' }
                    }
                },
                
                FamilyInvite: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Invite ID' },
                        familyGroupId: { type: 'string', description: 'Reference to FamilyGroup' },
                        invitedBy: { type: 'string', description: 'Tourist ID of inviter' },
                        invitedTouristId: { type: 'string', description: 'Tourist ID of invitee (if known)' },
                        email: { type: 'string', format: 'email', description: 'Email of invitee' },
                        phone: { type: 'string', description: 'Phone number of invitee' },
                        role: { type: 'string', enum: ['admin', 'guardian', 'member', 'child'] },
                        status: { type: 'string', enum: ['pending', 'accepted', 'declined', 'expired'] },
                        message: { type: 'string', description: 'Personal message from inviter' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        respondedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                
                FamilyAlert: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Alert ID' },
                        familyGroupId: { type: 'string', description: 'Reference to FamilyGroup' },
                        triggeredBy: { type: 'string', description: 'Tourist ID who triggered alert' },
                        alertType: { 
                            type: 'string', 
                            enum: ['sos', 'emergency', 'geofence_exit', 'low_battery', 'inactive', 'check_in_request', 'custom']
                        },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        message: { type: 'string' },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['Point'] },
                                coordinates: { type: 'array', items: { type: 'number' } }
                            }
                        },
                        status: { type: 'string', enum: ['active', 'acknowledged', 'resolved', 'expired'] },
                        acknowledgedBy: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    memberId: { type: 'string' },
                                    acknowledgedAt: { type: 'string', format: 'date-time' },
                                    response: { type: 'string' }
                                }
                            }
                        },
                        expiresAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                
                FamilyLocationShare: {
                    type: 'object',
                    required: ['latitude', 'longitude'],
                    properties: {
                        latitude: { type: 'number', minimum: -90, maximum: 90 },
                        longitude: { type: 'number', minimum: -180, maximum: 180 },
                        accuracy: { type: 'number', description: 'GPS accuracy in meters' },
                        batteryLevel: { type: 'number', minimum: 0, maximum: 100 }
                    },
                    example: {
                        latitude: 26.1445,
                        longitude: 91.7362,
                        accuracy: 10,
                        batteryLevel: 85
                    }
                },
                
                FamilySOSRequest: {
                    type: 'object',
                    properties: {
                        latitude: { type: 'number', minimum: -90, maximum: 90 },
                        longitude: { type: 'number', minimum: -180, maximum: 180 },
                        message: { type: 'string', description: 'Emergency message' },
                        alertType: { type: 'string', enum: ['emergency', 'sos', 'custom'], default: 'sos' }
                    },
                    example: {
                        latitude: 26.1445,
                        longitude: 91.7362,
                        message: 'Need immediate assistance!',
                        alertType: 'sos'
                    }
                }
            }
        },
        paths: {
            '/api/users/verify': {
                post: {
                    summary: 'Verify Firebase authentication token',
                    description: 'Verifies the provided Firebase ID token and returns user information',
                    tags: ['🔐 Mobile App - Authentication'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Token verified successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            user: {
                                                                allOf: [
                                                                    { $ref: '#/components/schemas/User' },
                                                                    {
                                                                        type: 'object',
                                                                        properties: {
                                                                            tokenValid: {
                                                                                type: 'boolean',
                                                                                example: true
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        500: {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users/me': {
                get: {
                    summary: 'Get current user information',
                    description: 'Retrieves current user information from Firebase token',
                    tags: ['🔐 Mobile App - Authentication'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'User information retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            user: {
                                                                allOf: [
                                                                    { $ref: '#/components/schemas/User' },
                                                                    {
                                                                        type: 'object',
                                                                        properties: {
                                                                            source: {
                                                                                type: 'string',
                                                                                example: 'firebase_token'
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Invalid or expired token',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        500: {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users/profile': {
                get: {
                    summary: 'Get tourist profile',
                    description: 'Retrieve tourist profile information. Requires Firebase authentication.',
                    tags: ['📱 Mobile App - Profile Management'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Tourist profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            profile: {
                                                                $ref: '#/components/schemas/Tourist'
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized - Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Profile not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                put: {
                    summary: 'Update tourist profile',
                    description: 'Update the current user\'s tourist profile information',
                    tags: ['📱 Mobile App - Profile Management'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        personalInfo: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                phone: { type: 'string' },
                                                dateOfBirth: { type: 'string', format: 'date' },
                                                nationality: { type: 'string' },
                                                address: { type: 'string' }
                                            }
                                        },
                                        emergencyContacts: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    phone: { type: 'string' },
                                                    relationship: { type: 'string' }
                                                }
                                            }
                                        },
                                        preferences: {
                                            type: 'object',
                                            properties: {
                                                language: { type: 'string' },
                                                notifications: {
                                                    type: 'object',
                                                    properties: {
                                                        push: { type: 'boolean' },
                                                        sms: { type: 'boolean' },
                                                        email: { type: 'boolean' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Profile updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            profile: { $ref: '#/components/schemas/User' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/users/profile/status': {
                get: {
                    summary: 'Get profile completion status',
                    description: 'Check the completion status of the user\'s profile',
                    tags: ['📱 Mobile App - Profile Management'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Profile status retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            completionPercentage: { type: 'number' },
                                                            missingFields: {
                                                                type: 'array',
                                                                items: { type: 'string' }
                                                            },
                                                            stage: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/ocr/process': {
                post: {
                    summary: 'Process document with OCR',
                    description: 'Upload an Aadhaar card or passport image to extract name, DOB, address, and phone number',
                    tags: ['📱 Mobile App - Document Processing'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        document: {
                                            type: 'string',
                                            format: 'binary',
                                            description: 'Document image file (JPEG, PNG, WebP)'
                                        }
                                    },
                                    required: ['document']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Document processed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    documentType: { type: 'string', enum: ['aadhaar', 'passport'] },
                                                    extractedInfo: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' },
                                                            dob: { type: 'string' },
                                                            address: { type: 'string' },
                                                            phone: { type: 'string' },
                                                            documentNumber: { type: 'string' }
                                                        }
                                                    },
                                                    confidence: { type: 'number' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/ocr/health': {
                get: {
                    summary: 'Check OCR service health',
                    description: 'Check if OCR service is running and configured properly',
                    tags: ['🔧 System Health'],
                    responses: {
                        200: {
                            description: 'OCR service status',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            timestamp: { type: 'string', format: 'date-time' },
                                            services: {
                                                type: 'object',
                                                properties: {
                                                    azure: { type: 'boolean' },
                                                    upload: { type: 'boolean' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/update/me': {
                post: {
                    summary: 'Update my location',
                    description: 'Update the current user\'s location coordinates',
                    tags: ['📱 Mobile App - Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LocationUpdateRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Location updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            location: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/update': {
                post: {
                    summary: 'Update tourist location',
                    description: 'Update location for a specific tourist (admin function)',
                    tags: ['🌐 Admin Website - Location Management'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/LocationUpdateRequest' },
                                        {
                                            type: 'object',
                                            properties: {
                                                touristId: { type: 'string' }
                                            },
                                            required: ['touristId']
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Location updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/current/me': {
                get: {
                    summary: 'Get my current location',
                    description: 'Retrieve the current user\'s latest location',
                    tags: ['📱 Mobile App - Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Current location retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            currentLocation: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' },
                                                                    address: { type: 'string' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Location not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/current/{touristId}': {
                get: {
                    summary: 'Get tourist current location',
                    description: 'Retrieve current location for a specific tourist',
                    tags: ['🌐 Admin Website - Location Management'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist location retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            currentLocation: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' },
                                                                    accuracy: { type: 'number' },
                                                                    address: { type: 'string' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/heatmap': {
                get: {
                    summary: 'Get location heatmap data',
                    description: 'Retrieve heatmap data for tourist locations',
                    tags: ['🌐 Admin Website - Analytics'],
                    parameters: [
                        {
                            name: 'bounds',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Geographic bounds for heatmap (lat1,lng1,lat2,lng2)'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Heatmap data retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            heatmapData: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        intensity: { type: 'number' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/nearby': {
                get: {
                    summary: 'Get nearby tourists',
                    description: 'Find tourists near a specific location',
                    tags: ['🌐 Admin Website - Location Management'],
                    parameters: [
                        {
                            name: 'lat',
                            in: 'query',
                            required: true,
                            schema: { type: 'number' },
                            description: 'Latitude'
                        },
                        {
                            name: 'lng',
                            in: 'query',
                            required: true,
                            schema: { type: 'number' },
                            description: 'Longitude'
                        },
                        {
                            name: 'radius',
                            in: 'query',
                            schema: { type: 'number' },
                            description: 'Search radius in kilometers'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Nearby tourists retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            tourists: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/User' }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/location/history/me': {
                get: {
                    summary: 'Get my location history',
                    description: 'Retrieve the current user\'s location history',
                    tags: ['📱 Mobile App - Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Maximum number of records to return'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Location history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            history: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        accuracy: { type: 'number' },
                                                                        address: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/location/history/{touristId}': {
                get: {
                    summary: 'Get tourist location history',
                    description: 'Retrieve location history for a specific tourist',
                    tags: ['🌐 Admin Website - Location Management'],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        },
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for history (YYYY-MM-DD)'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Maximum number of records to return'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist location history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            history: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        accuracy: { type: 'number' },
                                                                        address: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/stats': {
                get: {
                    summary: 'Get tourist statistics',
                    description: 'Retrieve statistics for the current tourist',
                    tags: ['📱 Mobile App - Statistics'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Statistics retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            totalDistance: { type: 'number' },
                                                            placesVisited: { type: 'integer' },
                                                            activeDays: { type: 'integer' },
                                                            safetyScore: { type: 'number' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/devices/connected': {
                get: {
                    summary: 'Get connected devices',
                    description: 'Retrieve list of connected devices for the current tourist',
                    tags: ['📱 Mobile App - Device Management'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Connected devices retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            devices: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        deviceId: { type: 'string' },
                                                                        deviceType: { type: 'string' },
                                                                        lastSeen: { type: 'string', format: 'date-time' },
                                                                        status: { type: 'string' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/active': {
                get: {
                    summary: 'Get active alerts',
                    description: 'Retrieve active alerts for the current tourist',
                    tags: ['📱 Mobile App - Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Page number for pagination'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Number of alerts per page'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Active alerts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alerts: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        _id: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        severity: { type: 'string' },
                                                                        message: { type: 'string' },
                                                                        location: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' }
                                                                            }
                                                                        },
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        acknowledged: { type: 'boolean' }
                                                                    }
                                                                }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/acknowledge/{alertId}': {
                post: {
                    summary: 'Acknowledge alert',
                    description: 'Mark an alert as acknowledged',
                    tags: ['📱 Mobile App - Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'alertId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Alert ID to acknowledge'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Alert acknowledged successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Alert not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/emergency/me': {
                post: {
                    summary: 'Create emergency alert (self)',
                    description: 'Create an emergency alert for the current user',
                    tags: ['📱 Mobile App - Emergency Alerts'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        type: { type: 'string', enum: ['medical', 'security', 'accident', 'other'] },
                                        message: { type: 'string' },
                                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                                    },
                                    required: ['latitude', 'longitude', 'type']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Emergency alert created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alertId: { type: 'string' },
                                                            status: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/emergency': {
                post: {
                    summary: 'Create emergency alert for tourist',
                    description: 'Create an emergency alert for a specific tourist (admin function)',
                    tags: ['🌐 Admin Website - Emergency Management'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        touristId: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        type: { type: 'string', enum: ['medical', 'security', 'accident', 'other'] },
                                        message: { type: 'string' },
                                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                                    },
                                    required: ['touristId', 'latitude', 'longitude', 'type']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Emergency alert created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alertId: { type: 'string' },
                                                            status: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                get: {
                    summary: 'Get emergency alerts',
                    description: 'Retrieve list of emergency alerts with optional filtering and pagination',
                    tags: ['🌐 Admin Website - Emergency Management'],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer', default: 1 },
                            description: 'Page number for pagination'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer', default: 20 },
                            description: 'Number of alerts per page'
                        },
                        {
                            name: 'touristId',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Filter by tourist ID'
                        },
                        {
                            name: 'severity',
                            in: 'query',
                            schema: { type: 'string', enum: ['info', 'warning', 'critical', 'emergency'] },
                            description: 'Filter by alert severity'
                        },
                        {
                            name: 'acknowledged',
                            in: 'query',
                            schema: { type: 'boolean' },
                            description: 'Filter by acknowledgment status'
                        },
                        {
                            name: 'startDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for filtering alerts (YYYY-MM-DD)'
                        },
                        {
                            name: 'endDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for filtering alerts (YYYY-MM-DD)'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Emergency alerts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alerts: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        id: { type: 'string' },
                                                                        alertId: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        severity: { type: 'string' },
                                                                        message: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                english: { type: 'string' },
                                                                                hindi: { type: 'string' },
                                                                                local: { type: 'string' }
                                                                            }
                                                                        },
                                                                        location: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' }
                                                                            }
                                                                        },
                                                                        tourist: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                id: { type: 'string' },
                                                                                digitalId: { type: 'string' },
                                                                                name: { type: 'string' },
                                                                                email: { type: 'string' },
                                                                                phone: { type: 'string' }
                                                                            }
                                                                        },
                                                                        acknowledgment: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                isAcknowledged: { type: 'boolean' },
                                                                                acknowledgedAt: { type: 'string', format: 'date-time' },
                                                                                response: { type: 'string' }
                                                                            }
                                                                        },
                                                                        createdAt: { type: 'string', format: 'date-time' },
                                                                        updatedAt: { type: 'string', format: 'date-time' }
                                                                    }
                                                                }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    currentPage: { type: 'integer' },
                                                                    totalPages: { type: 'integer' },
                                                                    totalAlerts: { type: 'integer' },
                                                                    limit: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/alerts/emergency/tourist/{touristId}': {
                delete: {
                    summary: 'Acknowledge and delete all emergency alerts for a tourist',
                    description: 'Acknowledge all unacknowledged emergency alerts for a specific tourist and remove them from the system. Updates tourist status to active.',
                    tags: ['🌐 Admin Website - Emergency Management'],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID to acknowledge and delete all alerts for'
                        }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        response: { 
                                            type: 'string', 
                                            description: 'Acknowledgment response or notes for all alerts' 
                                        },
                                        acknowledgedBy: { 
                                            type: 'string', 
                                            description: 'Name or ID of person acknowledging the alerts' 
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'All emergency alerts for tourist acknowledged and deleted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            touristId: { type: 'string' },
                                                            digitalId: { type: 'string' },
                                                            touristName: { type: 'string' },
                                                            alertsProcessed: { type: 'integer', description: 'Number of alerts acknowledged' },
                                                            alertsDeleted: { type: 'integer', description: 'Number of alerts deleted' },
                                                            acknowledgedAt: { type: 'string', format: 'date-time' },
                                                            acknowledgedBy: { type: 'string' },
                                                            response: { type: 'string' },
                                                            updatedStatus: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request - Tourist ID required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Tourist not found or no unacknowledged alerts', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/geofences': {
                get: {
                    summary: 'Get geofences',
                    description: 'Retrieve list of geofences with optional pagination. Use all=true or limit=all to get all geofences without pagination.',
                    tags: ['🌐 Admin Website - Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'Page number for pagination (ignored when all=true)'
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Number of geofences per page. Use "all" or "0" to get all geofences without pagination'
                        },
                        {
                            name: 'all',
                            in: 'query',
                            schema: { type: 'boolean' },
                            description: 'Set to true to retrieve all geofences without pagination'
                        },
                        {
                            name: 'type',
                            in: 'query',
                            schema: { type: 'string', enum: ['safe', 'warning', 'danger', 'restricted', 'emergency_services', 'accommodation', 'tourist_spot'] },
                            description: 'Filter by geofence type'
                        },
                        {
                            name: 'isActive',
                            in: 'query',
                            schema: { type: 'boolean' },
                            description: 'Filter by active status'
                        },
                        {
                            name: 'riskLevel',
                            in: 'query',
                            schema: { type: 'integer', minimum: 1, maximum: 10 },
                            description: 'Filter by risk level (1-10)'
                        },
                        {
                            name: 'search',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Search in geofence name and description'
                        },
                        {
                            name: 'sortBy',
                            in: 'query',
                            schema: { type: 'string', default: 'createdAt' },
                            description: 'Field to sort by'
                        },
                        {
                            name: 'sortOrder',
                            in: 'query',
                            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                            description: 'Sort order'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Geofences retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            geofences: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        _id: { type: 'string' },
                                                                        name: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        center: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' }
                                                                            }
                                                                        },
                                                                        radius: { type: 'number' },
                                                                        active: { type: 'boolean' },
                                                                        createdAt: { type: 'string', format: 'date-time' }
                                                                    }
                                                                }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                post: {
                    summary: 'Create geofence',
                    description: 'Create a new geofence',
                    tags: ['🌐 Admin Website - Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string', enum: ['safe_zone', 'danger_zone', 'restricted_area'] },
                                        center: {
                                            type: 'object',
                                            properties: {
                                                latitude: { type: 'number' },
                                                longitude: { type: 'number' }
                                            },
                                            required: ['latitude', 'longitude']
                                        },
                                        radius: { type: 'number' },
                                        description: { type: 'string' }
                                    },
                                    required: ['name', 'type', 'center', 'radius']
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Geofence created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            geofenceId: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/geofences/{fenceId}': {
                put: {
                    summary: 'Update geofence',
                    description: 'Update an existing geofence',
                    tags: ['🌐 Admin Website - Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'fenceId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Geofence ID to update'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string', enum: ['safe_zone', 'danger_zone', 'restricted_area'] },
                                        center: {
                                            type: 'object',
                                            properties: {
                                                latitude: { type: 'number' },
                                                longitude: { type: 'number' }
                                            }
                                        },
                                        radius: { type: 'number' },
                                        description: { type: 'string' },
                                        active: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Geofence updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Geofence not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                delete: {
                    summary: 'Delete geofence',
                    description: 'Delete an existing geofence',
                    tags: ['🌐 Admin Website - Geofencing'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'fenceId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Geofence ID to delete'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Geofence deleted successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/SuccessResponse' }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Geofence not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/tracking/tourists/all': {
                get: {
                    summary: 'Get all tourists with their latest locations',
                    description: 'Retrieve all registered tourists along with their most recent location data for administrative monitoring',
                    tags: ['🌐 Admin Website - Location Management'],
                    responses: {
                        200: {
                            description: 'All tourists with locations retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            totalTourists: {
                                                                type: 'integer',
                                                                description: 'Total number of tourists found'
                                                            },
                                                            tourists: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        touristId: {
                                                                            type: 'string',
                                                                            description: 'MongoDB ObjectId of the tourist'
                                                                        },
                                                                        digitalId: {
                                                                            type: 'string',
                                                                            description: 'Unique digital identifier for the tourist'
                                                                        },
                                                                        firebaseUid: {
                                                                            type: 'string',
                                                                            description: 'Firebase authentication UID'
                                                                        },
                                                                        personalInfo: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                name: { type: 'string' },
                                                                                email: { type: 'string' },
                                                                                phone: { type: 'string' },
                                                                                nationality: { type: 'string' },
                                                                                profilePhoto: { type: 'string', description: 'URL to profile picture' }
                                                                            }
                                                                        },
                                                                        createdAt: {
                                                                            type: 'string',
                                                                            format: 'date-time',
                                                                            description: 'Tourist registration timestamp'
                                                                        },
                                                                        latestLocation: {
                                                                            oneOf: [
                                                                                {
                                                                                    type: 'object',
                                                                                    properties: {
                                                                                        coordinates: {
                                                                                            type: 'array',
                                                                                            items: { type: 'number' },
                                                                                            minItems: 2,
                                                                                            maxItems: 2,
                                                                                            description: 'GeoJSON coordinates [longitude, latitude]'
                                                                                        },
                                                                                        timestamp: {
                                                                                            type: 'string',
                                                                                            format: 'date-time',
                                                                                            description: 'Location update timestamp'
                                                                                        },
                                                                                        accuracy: {
                                                                                            type: 'number',
                                                                                            description: 'Location accuracy in meters'
                                                                                        },
                                                                                        speed: {
                                                                                            type: 'number',
                                                                                            description: 'Speed in m/s'
                                                                                        }
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: 'null',
                                                                                    description: 'No location data available for this tourist'
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        500: { 
                            description: 'Internal server error', 
                            content: { 
                                'application/json': { 
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/locations/all': {
                get: {
                    summary: 'Get all tourist current locations',
                    description: 'Retrieve current locations for all tourists (simplified version)',
                    tags: ['🌐 Admin Website - Location Management'],
                    responses: {
                        200: {
                            description: 'All tourist current locations retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            locations: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        touristId: { type: 'string' },
                                                                        digitalId: { type: 'string' },
                                                                        name: { type: 'string' },
                                                                        currentLocation: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' },
                                                                                lastUpdate: { type: 'string', format: 'date-time' }
                                                                            }
                                                                        },
                                                                        isActive: { type: 'boolean' },
                                                                        status: { type: 'string' }
                                                                    }
                                                                }
                                                            },
                                                            count: { type: 'integer' },
                                                            timestamp: { type: 'string', format: 'date-time' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'No tourists with current locations found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/users/debug-token': {
                post: {
                    summary: 'Debug Firebase token',
                    description: 'Debug endpoint for troubleshooting Firebase token issues',
                    tags: ['🔐 Mobile App - Authentication'],
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Token debug information',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            debug: {
                                                type: 'object',
                                                properties: {
                                                    tokenLength: { type: 'integer' },
                                                    partsCount: { type: 'integer' },
                                                    isValidJWT: { type: 'boolean' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/users/all': {
                get: {
                    summary: 'Get all tourists',
                    description: 'Retrieve all tourists (admin endpoint)',
                    tags: ['🌐 Admin Website - Location Management'],
                    responses: {
                        200: {
                            description: 'All tourists retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            tourists: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        id: { type: 'string' },
                                                                        digitalId: { type: 'string' },
                                                                        name: { type: 'string' },
                                                                        email: { type: 'string' }
                                                                    }
                                                                }
                                                            },
                                                            count: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/users/{touristId}': {
                get: {
                    summary: 'Get tourist by ID',
                    description: 'Retrieve a specific tourist by their ID',
                    tags: ['🌐 Admin Website - Location Management'],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            tourist: {
                                                                type: 'object',
                                                                properties: {
                                                                    id: { type: 'string' },
                                                                    digitalId: { type: 'string' },
                                                                    name: { type: 'string' },
                                                                    email: { type: 'string' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Tourist not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/health': {
                get: {
                    summary: 'Check remote blockchain health',
                    description: 'Check the health status of the remote blockchain VPS service',
                    tags: ['🔧 System Health'],
                    responses: {
                        200: {
                            description: 'Blockchain health status',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            status: { type: 'string' },
                                                            network: { type: 'string' },
                                                            peers: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        500: { description: 'Blockchain health check failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/audit/{touristId}': {
                get: {
                    summary: 'Get blockchain audit trail',
                    description: 'Retrieve blockchain audit trail for a specific tourist',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'touristId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist ID'
                        },
                        {
                            name: 'fromDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'Start date for audit trail'
                        },
                        {
                            name: 'toDate',
                            in: 'query',
                            schema: { type: 'string', format: 'date' },
                            description: 'End date for audit trail'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Audit trail retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            touristId: { type: 'string' },
                                                            blockchainDID: { type: 'string' },
                                                            auditTrail: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        timestamp: { type: 'string', format: 'date-time' },
                                                                        action: { type: 'string' },
                                                                        details: { type: 'object' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Tourist not found or no blockchain record', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/verify/me': {
                get: {
                    summary: 'Verify my blockchain record',
                    description: 'Verify the blockchain record for the authenticated user',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Blockchain verification completed',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            digitalId: { type: 'string' },
                                                            blockchainDID: { type: 'string' },
                                                            verification: { type: 'object' },
                                                            blockchainStatus: { type: 'object' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'No blockchain record found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/verify/{did}': {
                post: {
                    summary: 'Verify tourist DID (Authority)',
                    description: 'Verify a tourist\'s DID - requires authority access',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'did',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist DID to verify'
                        }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        verifierDID: { type: 'string', description: 'Optional verifier DID' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'DID verification completed',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: { type: 'object' }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Verification requires authority access', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/transactions/bulk': {
                post: {
                    summary: 'Submit bulk blockchain transactions',
                    description: 'Submit multiple blockchain transactions in bulk - requires admin access',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        transactions: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    type: { type: 'string' },
                                                    data: { type: 'object' }
                                                }
                                            }
                                        }
                                    },
                                    required: ['transactions']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Bulk transactions submitted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            results: { type: 'array' },
                                                            totalTransactions: { type: 'integer' },
                                                            successful: { type: 'integer' },
                                                            failed: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Bulk operations require admin access', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/blockchain/tourist/{did}': {
                get: {
                    summary: 'Query tourist from blockchain',
                    description: 'Retrieve tourist data from blockchain by DID',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'did',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist DID'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Tourist data retrieved from blockchain',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: { type: 'object' }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Tourist not found on blockchain', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                put: {
                    summary: 'Update tourist status on blockchain',
                    description: 'Update tourist status on blockchain - requires authority access',
                    tags: ['🔧 System Health'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        {
                            name: 'did',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Tourist DID'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', description: 'New status for the tourist' },
                                        reason: { type: 'string', description: 'Reason for status update' }
                                    },
                                    required: ['status']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Tourist status updated on blockchain',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: { type: 'object' }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Status updates require authority access', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        400: { description: 'Status is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            
            // ==================== FAMILY TRACKING API PATHS ====================
            '/api/family/groups': {
                post: {
                    summary: 'Create a new family group',
                    description: 'Create a new family group with the authenticated user as the creator and admin',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name'],
                                    properties: {
                                        name: { type: 'string', description: 'Name of the family group', example: 'Smith Family' },
                                        description: { type: 'string', description: 'Optional description', example: 'Our family vacation group' },
                                        settings: {
                                            type: 'object',
                                            properties: {
                                                allowMemberInvites: { type: 'boolean', default: false },
                                                requireApprovalToJoin: { type: 'boolean', default: true },
                                                shareLocationByDefault: { type: 'boolean', default: true },
                                                notifyOnEmergency: { type: 'boolean', default: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Family group created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            group: { $ref: '#/components/schemas/FamilyGroup' },
                                                            inviteCode: { type: 'string', description: 'Initial invite code' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid input - name is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                get: {
                    summary: 'Get my family groups',
                    description: 'Retrieve all family groups the authenticated user is a member of',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Family groups retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            groups: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/FamilyGroup' }
                                                            },
                                                            count: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/join': {
                post: {
                    summary: 'Join a family group using invite code',
                    description: 'Join an existing family group using the invite code shared by group members',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['inviteCode'],
                                    properties: {
                                        inviteCode: { type: 'string', description: 'The invite code to join', example: 'ABC123XY' },
                                        nickname: { type: 'string', description: 'Your display name in the group', example: 'Dad' },
                                        relationship: { 
                                            type: 'string', 
                                            enum: ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'relative', 'friend', 'other'],
                                            example: 'parent'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Successfully joined or join request sent',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            member: { $ref: '#/components/schemas/FamilyMember' },
                                                            group: { $ref: '#/components/schemas/FamilyGroup' },
                                                            status: { type: 'string', enum: ['joined', 'pending_approval'] }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid or expired invite code, or already a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Group not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}': {
                get: {
                    summary: 'Get family group details',
                    description: 'Retrieve detailed information about a specific family group including members',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    responses: {
                        200: {
                            description: 'Family group details retrieved',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            group: { $ref: '#/components/schemas/FamilyGroup' },
                                                            members: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/FamilyMember' }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Not a member of this group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Group not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                put: {
                    summary: 'Update family group settings',
                    description: 'Update family group name, description, or settings (admin only)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        settings: {
                                            type: 'object',
                                            properties: {
                                                allowMemberInvites: { type: 'boolean' },
                                                requireApprovalToJoin: { type: 'boolean' },
                                                shareLocationByDefault: { type: 'boolean' },
                                                notifyOnEmergency: { type: 'boolean' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Group updated successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        403: { description: 'Not an admin of this group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Group not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                },
                delete: {
                    summary: 'Delete family group',
                    description: 'Delete a family group (creator only)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    responses: {
                        200: { description: 'Group deleted successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        403: { description: 'Only the creator can delete the group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Group not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/invite-code': {
                post: {
                    summary: 'Generate new invite code',
                    description: 'Generate or refresh the invite code for a family group (admin/guardian only)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        expiryHours: { type: 'number', default: 24, description: 'Hours until the code expires' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Invite code generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            inviteCode: { type: 'string' },
                                                            expiresAt: { type: 'string', format: 'date-time' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Not authorized to generate invite codes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/invite': {
                post: {
                    summary: 'Invite a user to the group',
                    description: 'Send an invitation to a user by email, phone, or tourist ID',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        phone: { type: 'string' },
                                        touristId: { type: 'string' },
                                        role: { type: 'string', enum: ['admin', 'guardian', 'member', 'child'], default: 'member' },
                                        relationship: { type: 'string', enum: ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'relative', 'friend', 'other'] },
                                        message: { type: 'string', description: 'Personal message for the invitee' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Invitation sent successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            invite: { $ref: '#/components/schemas/FamilyInvite' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'At least one identifier required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        403: { description: 'Not authorized to invite members', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/members/{memberId}/approve': {
                post: {
                    summary: 'Approve or reject a pending member',
                    description: 'Approve or reject a member who is waiting for approval (admin/guardian only)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' },
                        { name: 'memberId', in: 'path', required: true, schema: { type: 'string' }, description: 'Member ID to approve/reject' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['approve'],
                                    properties: {
                                        approve: { type: 'boolean', description: 'True to approve, false to reject' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Member approved/rejected successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        403: { description: 'Not authorized to approve members', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Member not found or not pending', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/members/{memberId}': {
                delete: {
                    summary: 'Remove a member from the group',
                    description: 'Remove a member from the family group (admin only, or self-removal)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' },
                        { name: 'memberId', in: 'path', required: true, schema: { type: 'string' }, description: 'Member ID to remove' }
                    ],
                    responses: {
                        200: { description: 'Member removed successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        403: { description: 'Not authorized to remove this member', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Member not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/members/me': {
                put: {
                    summary: 'Update my member settings',
                    description: 'Update your own settings within a family group (nickname, location sharing preferences)',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nickname: { type: 'string' },
                                        settings: {
                                            type: 'object',
                                            properties: {
                                                shareLocation: { type: 'boolean' },
                                                receiveAlerts: { type: 'boolean' },
                                                canViewOthersLocation: { type: 'boolean' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Settings updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            member: { $ref: '#/components/schemas/FamilyMember' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Not a member of this group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/members/{memberId}/request-checkin': {
                post: {
                    summary: 'Request check-in from a family member',
                    description: 'Send a check-in request notification to a family member',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' },
                        { name: 'memberId', in: 'path', required: true, schema: { type: 'string' }, description: 'Member ID to request check-in from' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', description: 'Optional message for the check-in request' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Check-in request sent', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        403: { description: 'Not authorized to request check-ins', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Member not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/locations': {
                get: {
                    summary: 'Get all family members locations',
                    description: 'Retrieve the current locations of all family members who are sharing their location',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    responses: {
                        200: {
                            description: 'Family member locations retrieved',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            members: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        memberId: { type: 'string' },
                                                                        touristId: { type: 'string' },
                                                                        nickname: { type: 'string' },
                                                                        role: { type: 'string' },
                                                                        location: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' },
                                                                                timestamp: { type: 'string', format: 'date-time' },
                                                                                accuracy: { type: 'number' },
                                                                                batteryLevel: { type: 'number' }
                                                                            }
                                                                        },
                                                                        isOnline: { type: 'boolean' },
                                                                        lastSeen: { type: 'string', format: 'date-time' }
                                                                    }
                                                                }
                                                            },
                                                            timestamp: { type: 'string', format: 'date-time' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Not a member or location viewing disabled', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        404: { description: 'Group not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/share-location': {
                post: {
                    summary: 'Share location with family group',
                    description: 'Share your current location with all family group members',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/FamilyLocationShare' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Location shared successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            location: {
                                                                type: 'object',
                                                                properties: {
                                                                    latitude: { type: 'number' },
                                                                    longitude: { type: 'number' },
                                                                    timestamp: { type: 'string', format: 'date-time' }
                                                                }
                                                            },
                                                            sharedWithCount: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid coordinates', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}},
                        403: { description: 'Location sharing disabled for this member', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/sos': {
                post: {
                    summary: 'Send SOS/Emergency alert to family',
                    description: 'Send an emergency SOS alert to all family group members',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/FamilySOSRequest' }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'SOS alert sent successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alert: { $ref: '#/components/schemas/FamilyAlert' },
                                                            notifiedCount: { type: 'integer', description: 'Number of members notified' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Not a member of this group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/groups/{groupId}/alerts': {
                get: {
                    summary: 'Get family group alerts',
                    description: 'Retrieve all alerts for a family group with optional filtering',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'groupId', in: 'path', required: true, schema: { type: 'string' }, description: 'Family group ID' },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'acknowledged', 'resolved', 'expired'] }, description: 'Filter by alert status' },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Number of alerts per page' },
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' }
                    ],
                    responses: {
                        200: {
                            description: 'Alerts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alerts: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/FamilyAlert' }
                                                            },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' },
                                                                    totalPages: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        403: { description: 'Not a member of this group', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/invites': {
                get: {
                    summary: 'Get my pending invitations',
                    description: 'Retrieve all pending family group invitations for the authenticated user',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    responses: {
                        200: {
                            description: 'Invitations retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            invites: {
                                                                type: 'array',
                                                                items: { $ref: '#/components/schemas/FamilyInvite' }
                                                            },
                                                            count: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/family/invites/{inviteId}/respond': {
                post: {
                    summary: 'Respond to invitation',
                    description: 'Accept or decline a family group invitation',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'inviteId', in: 'path', required: true, schema: { type: 'string' }, description: 'Invitation ID' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['accept'],
                                    properties: {
                                        accept: { type: 'boolean', description: 'True to accept, false to decline' },
                                        nickname: { type: 'string', description: 'Your nickname in the group (if accepting)' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Response recorded successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            status: { type: 'string', enum: ['accepted', 'declined'] },
                                                            group: { $ref: '#/components/schemas/FamilyGroup' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Invitation not found or expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/family/alerts/{alertId}/acknowledge': {
                post: {
                    summary: 'Acknowledge a family alert',
                    description: 'Mark a family alert as acknowledged with an optional response',
                    tags: ['👨‍👩‍👧‍👦 Family Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'alertId', in: 'path', required: true, schema: { type: 'string' }, description: 'Alert ID' }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        response: { type: 'string', description: 'Optional response message' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Alert acknowledged successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            alert: { $ref: '#/components/schemas/FamilyAlert' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Alert not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            
            // ==================== MISSING TRACKING API PATHS ====================
            '/api/tracking/config': {
                get: {
                    summary: 'Get tracking configuration',
                    description: 'Retrieve tracking configuration settings for the frontend application',
                    tags: ['🌐 Admin Website - Location Management'],
                    responses: {
                        200: {
                            description: 'Configuration retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            updateInterval: { type: 'integer', description: 'Location update interval in seconds' },
                                                            inactivityThreshold: { type: 'integer', description: 'Inactivity threshold in minutes' },
                                                            mapSettings: { type: 'object' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/tracking/inactive-users': {
                get: {
                    summary: 'Get inactive users',
                    description: 'Retrieve list of users who have been inactive for more than 10 minutes without location updates',
                    tags: ['🌐 Admin Website - Location Management'],
                    responses: {
                        200: {
                            description: 'Inactive users retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            inactiveUsers: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        touristId: { type: 'string' },
                                                                        digitalId: { type: 'string' },
                                                                        name: { type: 'string' },
                                                                        lastLocation: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                latitude: { type: 'number' },
                                                                                longitude: { type: 'number' },
                                                                                timestamp: { type: 'string', format: 'date-time' }
                                                                            }
                                                                        },
                                                                        inactiveMinutes: { type: 'number' }
                                                                    }
                                                                }
                                                            },
                                                            count: { type: 'integer' },
                                                            threshold: { type: 'integer', description: 'Inactivity threshold in minutes' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            
            // ==================== MAPS API PATHS ====================
            '/api/maps/config': {
                get: {
                    summary: 'Get maps configuration',
                    description: 'Get Azure Maps configuration for the frontend',
                    tags: ['🗺️ Maps'],
                    responses: {
                        200: {
                            description: 'Maps configuration retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            subscriptionKey: { type: 'string' },
                                                            clientId: { type: 'string' },
                                                            region: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/maps/geocode': {
                get: {
                    summary: 'Geocode address',
                    description: 'Convert address to coordinates using Azure Maps',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'address', in: 'query', required: true, schema: { type: 'string' }, description: 'Address to geocode' }
                    ],
                    responses: {
                        200: {
                            description: 'Geocoding successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            latitude: { type: 'number' },
                                                            longitude: { type: 'number' },
                                                            formattedAddress: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Address is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/reverse-geocode': {
                get: {
                    summary: 'Reverse geocode coordinates',
                    description: 'Convert coordinates to address using Azure Maps',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude' },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude' }
                    ],
                    responses: {
                        200: {
                            description: 'Reverse geocoding successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            address: { type: 'string' },
                                                            city: { type: 'string' },
                                                            country: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Latitude and longitude are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/search/poi': {
                get: {
                    summary: 'Search points of interest',
                    description: 'Search for nearby points of interest using Azure Maps',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'query', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query (e.g., "restaurant", "hotel")' },
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude for search center' },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude for search center' },
                        { name: 'radius', in: 'query', schema: { type: 'number', default: 5000 }, description: 'Search radius in meters' },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Maximum results to return' }
                    ],
                    responses: {
                        200: {
                            description: 'POI search successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            results: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        name: { type: 'string' },
                                                                        address: { type: 'string' },
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        category: { type: 'string' },
                                                                        distance: { type: 'number' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Missing required parameters', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/search/emergency': {
                get: {
                    summary: 'Search emergency services',
                    description: 'Search for nearby emergency services (hospitals, police stations, fire stations)',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude' },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude' },
                        { name: 'type', in: 'query', schema: { type: 'string', enum: ['hospital', 'police', 'fire'] }, description: 'Type of emergency service' },
                        { name: 'radius', in: 'query', schema: { type: 'number', default: 10000 }, description: 'Search radius in meters' }
                    ],
                    responses: {
                        200: {
                            description: 'Emergency services search successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            services: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        name: { type: 'string' },
                                                                        type: { type: 'string' },
                                                                        address: { type: 'string' },
                                                                        phone: { type: 'string' },
                                                                        latitude: { type: 'number' },
                                                                        longitude: { type: 'number' },
                                                                        distance: { type: 'number' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Latitude and longitude are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/route': {
                get: {
                    summary: 'Get route between two points',
                    description: 'Calculate route between origin and destination using Azure Maps',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'originLat', in: 'query', required: true, schema: { type: 'number' }, description: 'Origin latitude' },
                        { name: 'originLng', in: 'query', required: true, schema: { type: 'number' }, description: 'Origin longitude' },
                        { name: 'destLat', in: 'query', required: true, schema: { type: 'number' }, description: 'Destination latitude' },
                        { name: 'destLng', in: 'query', required: true, schema: { type: 'number' }, description: 'Destination longitude' },
                        { name: 'travelMode', in: 'query', schema: { type: 'string', enum: ['car', 'pedestrian', 'bicycle'], default: 'car' }, description: 'Mode of travel' }
                    ],
                    responses: {
                        200: {
                            description: 'Route calculated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            distance: { type: 'number', description: 'Distance in meters' },
                                                            duration: { type: 'number', description: 'Duration in seconds' },
                                                            coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Missing required coordinates', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/distance': {
                get: {
                    summary: 'Calculate distance between points',
                    description: 'Calculate straight-line distance between two geographic points',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'lat1', in: 'query', required: true, schema: { type: 'number' }, description: 'First point latitude' },
                        { name: 'lng1', in: 'query', required: true, schema: { type: 'number' }, description: 'First point longitude' },
                        { name: 'lat2', in: 'query', required: true, schema: { type: 'number' }, description: 'Second point latitude' },
                        { name: 'lng2', in: 'query', required: true, schema: { type: 'number' }, description: 'Second point longitude' }
                    ],
                    responses: {
                        200: {
                            description: 'Distance calculated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            distanceKm: { type: 'number' },
                                                            distanceM: { type: 'number' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'All coordinates are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/geofence/check': {
                post: {
                    summary: 'Check if point is in geofence',
                    description: 'Check if a given point is within a specified geofence',
                    tags: ['🗺️ Maps'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['latitude', 'longitude', 'geofenceId'],
                                    properties: {
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        geofenceId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Geofence check completed',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            isInside: { type: 'boolean' },
                                                            geofenceName: { type: 'string' },
                                                            distance: { type: 'number', description: 'Distance from geofence center in meters' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Missing required parameters', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/timezone': {
                get: {
                    summary: 'Get timezone for location',
                    description: 'Get timezone information for a specific location',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude' },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude' }
                    ],
                    responses: {
                        200: {
                            description: 'Timezone retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            timezone: { type: 'string' },
                                                            offset: { type: 'string' },
                                                            localTime: { type: 'string', format: 'date-time' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Latitude and longitude are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/maps/weather': {
                get: {
                    summary: 'Get weather for location',
                    description: 'Get current weather information for a specific location',
                    tags: ['🗺️ Maps'],
                    parameters: [
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude' },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude' }
                    ],
                    responses: {
                        200: {
                            description: 'Weather information retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            temperature: { type: 'number' },
                                                            humidity: { type: 'number' },
                                                            description: { type: 'string' },
                                                            windSpeed: { type: 'number' },
                                                            icon: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Latitude and longitude are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            
            // ==================== VIDEO API PATHS ====================
            '/api/videos/upload': {
                post: {
                    summary: 'Upload a single video',
                    description: 'Upload a video file to the server. Maximum file size is 500MB.',
                    tags: ['🎥 Video Management'],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['video'],
                                    properties: {
                                        video: { type: 'string', format: 'binary', description: 'Video file (MP4, AVI, MOV, MKV, WEBM)' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Video uploaded successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            videoId: { type: 'string' },
                                                            filename: { type: 'string' },
                                                            size: { type: 'number' },
                                                            mimeType: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid file type or missing file', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/videos/upload-multiple': {
                post: {
                    summary: 'Upload multiple videos',
                    description: 'Upload multiple video files at once. Maximum 10 files, 500MB each.',
                    tags: ['🎥 Video Management'],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        videos: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Video files' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Videos uploaded successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            videos: { type: 'array', items: { type: 'object' } },
                                                            count: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        400: { description: 'Invalid files or no files provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/videos': {
                get: {
                    summary: 'List all videos',
                    description: 'Retrieve a list of all uploaded videos with pagination',
                    tags: ['🎥 Video Management'],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Videos per page' }
                    ],
                    responses: {
                        200: {
                            description: 'Videos list retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            videos: { type: 'array', items: { type: 'object' } },
                                                            pagination: {
                                                                type: 'object',
                                                                properties: {
                                                                    page: { type: 'integer' },
                                                                    limit: { type: 'integer' },
                                                                    total: { type: 'integer' }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/videos/{videoId}/stream': {
                get: {
                    summary: 'Stream video',
                    description: 'Stream a video file with support for range requests (seeking)',
                    tags: ['🎥 Video Management'],
                    parameters: [
                        { name: 'videoId', in: 'path', required: true, schema: { type: 'string' }, description: 'Video ID or filename' }
                    ],
                    responses: {
                        200: { description: 'Video stream' },
                        206: { description: 'Partial content (range request)' },
                        404: { description: 'Video not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/videos/{videoId}/download': {
                get: {
                    summary: 'Download video',
                    description: 'Download a video file',
                    tags: ['🎥 Video Management'],
                    parameters: [
                        { name: 'videoId', in: 'path', required: true, schema: { type: 'string' }, description: 'Video ID or filename' }
                    ],
                    responses: {
                        200: { description: 'Video file download' },
                        404: { description: 'Video not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/videos/{videoId}/info': {
                get: {
                    summary: 'Get video info',
                    description: 'Get metadata and information about a specific video',
                    tags: ['🎥 Video Management'],
                    parameters: [
                        { name: 'videoId', in: 'path', required: true, schema: { type: 'string' }, description: 'Video ID or filename' }
                    ],
                    responses: {
                        200: {
                            description: 'Video info retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            videoId: { type: 'string' },
                                                            filename: { type: 'string' },
                                                            size: { type: 'number' },
                                                            mimeType: { type: 'string' },
                                                            createdAt: { type: 'string', format: 'date-time' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        404: { description: 'Video not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            '/api/videos/{videoId}': {
                delete: {
                    summary: 'Delete video',
                    description: 'Delete a video file from the server',
                    tags: ['🎥 Video Management'],
                    parameters: [
                        { name: 'videoId', in: 'path', required: true, schema: { type: 'string' }, description: 'Video ID or filename' }
                    ],
                    responses: {
                        200: { description: 'Video deleted successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' }}}},
                        404: { description: 'Video not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            },
            
            // ==================== LOCATION HISTORY ALTERNATE ENDPOINT ====================
            '/api/tracking/location/history/my': {
                get: {
                    summary: 'Get my location history (alternate)',
                    description: 'Alternate endpoint for retrieving the current user\'s location history',
                    tags: ['📱 Mobile App - Location Tracking'],
                    security: [{ FirebaseAuth: [] }],
                    parameters: [
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (YYYY-MM-DD)' },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (YYYY-MM-DD)' },
                        { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Maximum records to return' }
                    ],
                    responses: {
                        200: {
                            description: 'Location history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: [
                                            { $ref: '#/components/schemas/SuccessResponse' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            history: { type: 'array', items: { type: 'object' } }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}}}
                    }
                }
            }
        }
    },
    apis: ['./src/controllers/*.js', './src/routes/*.js'], 
};

const specs = swaggerJSDoc(options);
export default specs;