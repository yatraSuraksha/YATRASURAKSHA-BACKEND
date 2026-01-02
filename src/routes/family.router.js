import { Router } from 'express';
import {
    createFamilyGroup,
    getMyFamilyGroups,
    getFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    generateInviteCode,
    joinFamilyGroup,
    inviteToFamilyGroup,
    getMyInvites,
    respondToInvite,
    approveMember,
    removeMember,
    updateMyMemberSettings,
    getFamilyLocations,
    shareLocationWithFamily,
    sendFamilySOS,
    getFamilyAlerts,
    acknowledgeFamilyAlert,
    requestCheckIn
} from '../controllers/family.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.middleware.js';
import { validateOrCreateTourist, validateObjectId, sanitizeInput } from '../middlewares/validation.middleware.js';

const router = Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// All family routes require authentication
router.use(verifyFirebaseToken);
router.use(validateOrCreateTourist);

/**
 * @swagger
 * tags:
 *   name: Family
 *   description: Family tracking and group management APIs
 */

/**
 * @swagger
 * /api/family/groups:
 *   post:
 *     summary: Create a new family group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the family group
 *               description:
 *                 type: string
 *                 description: Optional description
 *               settings:
 *                 type: object
 *                 properties:
 *                   allowMemberInvites:
 *                     type: boolean
 *                   requireApprovalToJoin:
 *                     type: boolean
 *                   shareLocationByDefault:
 *                     type: boolean
 *                   notifyOnEmergency:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Family group created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/groups', createFamilyGroup);

/**
 * @swagger
 * /api/family/groups:
 *   get:
 *     summary: Get all family groups for the authenticated user
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of family groups
 *       401:
 *         description: Unauthorized
 */
router.get('/groups', getMyFamilyGroups);

/**
 * @swagger
 * /api/family/groups/join:
 *   post:
 *     summary: Join a family group using invite code
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *               nickname:
 *                 type: string
 *               relationship:
 *                 type: string
 *                 enum: [parent, child, spouse, sibling, grandparent, grandchild, relative, friend, other]
 *     responses:
 *       201:
 *         description: Successfully joined or request sent
 *       400:
 *         description: Invalid invite code or already a member
 *       404:
 *         description: Group not found
 */
router.post('/groups/join', joinFamilyGroup);

/**
 * @swagger
 * /api/family/groups/{groupId}:
 *   get:
 *     summary: Get a specific family group with members
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Family group details
 *       403:
 *         description: Not a member
 *       404:
 *         description: Group not found
 */
router.get('/groups/:groupId', getFamilyGroup);

/**
 * @swagger
 * /api/family/groups/{groupId}:
 *   put:
 *     summary: Update family group settings (admin only)
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       403:
 *         description: Not an admin
 */
router.put('/groups/:groupId', updateFamilyGroup);

/**
 * @swagger
 * /api/family/groups/{groupId}:
 *   delete:
 *     summary: Delete a family group (creator only)
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       403:
 *         description: Not the creator
 */
router.delete('/groups/:groupId', deleteFamilyGroup);

/**
 * @swagger
 * /api/family/groups/{groupId}/invite-code:
 *   post:
 *     summary: Generate or refresh invite code
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryHours:
 *                 type: number
 *                 default: 24
 *     responses:
 *       200:
 *         description: Invite code generated
 */
router.post('/groups/:groupId/invite-code', generateInviteCode);

/**
 * @swagger
 * /api/family/groups/{groupId}/invite:
 *   post:
 *     summary: Invite a user to the family group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               touristId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, guardian, member, child]
 *               relationship:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation sent
 */
router.post('/groups/:groupId/invite', inviteToFamilyGroup);

/**
 * @swagger
 * /api/family/groups/{groupId}/members/{memberId}/approve:
 *   post:
 *     summary: Approve or reject a pending member
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approve
 *             properties:
 *               approve:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Member approved/rejected
 */
router.post('/groups/:groupId/members/:memberId/approve', approveMember);

/**
 * @swagger
 * /api/family/groups/{groupId}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from the group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete('/groups/:groupId/members/:memberId', removeMember);

/**
 * @swagger
 * /api/family/groups/{groupId}/members/me:
 *   put:
 *     summary: Update your member settings in a group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   shareLocation:
 *                     type: boolean
 *                   receiveAlerts:
 *                     type: boolean
 *                   canViewOthersLocation:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/groups/:groupId/members/me', updateMyMemberSettings);

/**
 * @swagger
 * /api/family/groups/{groupId}/members/{memberId}/request-checkin:
 *   post:
 *     summary: Request check-in from a family member
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in request sent
 */
router.post('/groups/:groupId/members/:memberId/request-checkin', requestCheckIn);

/**
 * @swagger
 * /api/family/groups/{groupId}/locations:
 *   get:
 *     summary: Get all family members' current locations
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Family members' locations
 */
router.get('/groups/:groupId/locations', getFamilyLocations);

/**
 * @swagger
 * /api/family/groups/{groupId}/share-location:
 *   post:
 *     summary: Share your location with the family group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               batteryLevel:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location shared
 */
router.post('/groups/:groupId/share-location', shareLocationWithFamily);

/**
 * @swagger
 * /api/family/groups/{groupId}/sos:
 *   post:
 *     summary: Send SOS/emergency alert to family group
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               message:
 *                 type: string
 *               alertType:
 *                 type: string
 *                 enum: [emergency, sos, custom]
 *     responses:
 *       201:
 *         description: SOS alert sent
 */
router.post('/groups/:groupId/sos', sendFamilySOS);

/**
 * @swagger
 * /api/family/groups/{groupId}/alerts:
 *   get:
 *     summary: Get family group alerts
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, acknowledged, resolved, expired]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: List of alerts
 */
router.get('/groups/:groupId/alerts', getFamilyAlerts);

/**
 * @swagger
 * /api/family/invites:
 *   get:
 *     summary: Get pending invitations for the user
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations
 */
router.get('/invites', getMyInvites);

/**
 * @swagger
 * /api/family/invites/{inviteId}/respond:
 *   post:
 *     summary: Accept or decline an invitation
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accept
 *             properties:
 *               accept:
 *                 type: boolean
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response recorded
 */
router.post('/invites/:inviteId/respond', respondToInvite);

/**
 * @swagger
 * /api/family/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge a family alert
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
router.post('/alerts/:alertId/acknowledge', acknowledgeFamilyAlert);

export default router;
