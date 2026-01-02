import { FamilyGroup, FamilyMember, FamilyInvite, FamilyLocationLog, FamilyAlert } from '../models/family.model.js';
import Tourist from '../models/tourist.model.js';
import { broadcastToFamilyGroup, notifyFamilyMembers } from '../services/socket.service.js';

/**
 * Create a new family group
 * @route POST /api/family/groups
 */
export const createFamilyGroup = async (req, res) => {
    try {
        const { name, description, settings } = req.body;
        const touristId = req.tourist._id;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required and must be at least 2 characters'
            });
        }

        // Check if user already has too many groups (limit to 10)
        const existingGroupCount = await FamilyGroup.countDocuments({ createdBy: touristId, isActive: true });
        if (existingGroupCount >= 10) {
            return res.status(400).json({
                success: false,
                message: 'You can only create up to 10 family groups'
            });
        }

        // Create the family group
        const familyGroup = new FamilyGroup({
            groupId: FamilyGroup.generateGroupId(),
            name: name.trim(),
            description: description?.trim(),
            createdBy: touristId,
            settings: {
                ...settings,
                allowMemberInvites: settings?.allowMemberInvites ?? false,
                requireApprovalToJoin: settings?.requireApprovalToJoin ?? true,
                shareLocationByDefault: settings?.shareLocationByDefault ?? true,
                notifyOnEmergency: settings?.notifyOnEmergency ?? true
            }
        });

        await familyGroup.save();

        // Add creator as admin member
        const adminMember = new FamilyMember({
            groupId: familyGroup._id,
            touristId: touristId,
            role: 'admin',
            nickname: req.tourist.personalInfo?.name || 'Admin',
            relationship: 'other',
            settings: {
                shareLocation: true,
                receiveAlerts: true,
                canViewOthersLocation: true,
                isEmergencyContact: true
            },
            status: 'active'
        });

        await adminMember.save();

        // Update tourist's shareLocationWithFamily preference
        await Tourist.findByIdAndUpdate(touristId, {
            'preferences.shareLocationWithFamily': true
        });

        res.status(201).json({
            success: true,
            message: 'Family group created successfully',
            data: {
                group: {
                    _id: familyGroup._id,
                    groupId: familyGroup.groupId,
                    name: familyGroup.name,
                    description: familyGroup.description,
                    settings: familyGroup.settings,
                    createdAt: familyGroup.createdAt
                },
                membership: {
                    role: adminMember.role,
                    status: adminMember.status
                }
            }
        });

    } catch (error) {
        console.error('Error creating family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create family group',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get all family groups for the authenticated user
 * @route GET /api/family/groups
 */
export const getMyFamilyGroups = async (req, res) => {
    try {
        const touristId = req.tourist._id;

        // Find all groups where user is a member
        const memberships = await FamilyMember.find({
            touristId,
            status: { $in: ['active', 'pending'] }
        }).populate({
            path: 'groupId',
            match: { isActive: true },
            select: 'groupId name description settings stats createdBy createdAt'
        }).lean();

        const groups = memberships
            .filter(m => m.groupId) // Filter out null groups
            .map(m => ({
                ...m.groupId,
                membership: {
                    role: m.role,
                    status: m.status,
                    nickname: m.nickname,
                    relationship: m.relationship,
                    settings: m.settings,
                    joinedAt: m.joinedAt
                },
                isOwner: m.groupId.createdBy.toString() === touristId.toString()
            }));

        res.json({
            success: true,
            data: {
                groups,
                count: groups.length
            }
        });

    } catch (error) {
        console.error('Error getting family groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve family groups',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get a specific family group with members
 * @route GET /api/family/groups/:groupId
 */
export const getFamilyGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const touristId = req.tourist._id;

        // Find the group
        const group = await FamilyGroup.findOne({
            $or: [
                { _id: groupId },
                { groupId: groupId }
            ],
            isActive: true
        }).populate('createdBy', 'personalInfo.name digitalId').lean();

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check if user is a member
        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: { $in: ['active', 'pending'] }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this family group'
            });
        }

        // Get all members
        const members = await FamilyMember.find({
            groupId: group._id,
            status: 'active'
        }).populate({
            path: 'touristId',
            select: 'personalInfo.name personalInfo.profilePicture digitalId currentLocation status lastLocationUpdate'
        }).lean();

        // Get pending invites count (only for admins)
        let pendingInvites = 0;
        if (membership.role === 'admin' || membership.role === 'guardian') {
            pendingInvites = await FamilyInvite.countDocuments({
                groupId: group._id,
                status: 'pending'
            });
        }

        res.json({
            success: true,
            data: {
                group: {
                    ...group,
                    createdByName: group.createdBy?.personalInfo?.name
                },
                membership: {
                    role: membership.role,
                    status: membership.status,
                    settings: membership.settings
                },
                members: members.map(m => ({
                    memberId: m._id,
                    touristId: m.touristId?._id,
                    name: m.nickname || m.touristId?.personalInfo?.name,
                    profilePicture: m.touristId?.personalInfo?.profilePicture,
                    digitalId: m.touristId?.digitalId,
                    role: m.role,
                    relationship: m.relationship,
                    status: m.touristId?.status,
                    currentLocation: membership.settings.canViewOthersLocation && m.settings.shareLocation ? {
                        coordinates: m.touristId?.currentLocation?.coordinates,
                        lastUpdate: m.touristId?.lastLocationUpdate
                    } : null,
                    isOnline: m.touristId?.status === 'active',
                    joinedAt: m.joinedAt
                })),
                stats: {
                    totalMembers: members.length,
                    pendingInvites
                }
            }
        });

    } catch (error) {
        console.error('Error getting family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve family group',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Update family group settings
 * @route PUT /api/family/groups/:groupId
 */
export const updateFamilyGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, settings } = req.body;
        const touristId = req.tourist._id;

        // Find the group
        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check if user is admin
        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            role: 'admin',
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Only group admins can update group settings'
            });
        }

        // Update fields
        if (name) group.name = name.trim();
        if (description !== undefined) group.description = description?.trim();
        if (settings) {
            group.settings = {
                ...group.settings,
                ...settings
            };
        }

        await group.save();

        res.json({
            success: true,
            message: 'Family group updated successfully',
            data: {
                group: {
                    _id: group._id,
                    groupId: group.groupId,
                    name: group.name,
                    description: group.description,
                    settings: group.settings
                }
            }
        });

    } catch (error) {
        console.error('Error updating family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update family group',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Delete/deactivate a family group
 * @route DELETE /api/family/groups/:groupId
 */
export const deleteFamilyGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Only creator can delete
        if (group.createdBy.toString() !== touristId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the group creator can delete the group'
            });
        }

        // Soft delete
        group.isActive = false;
        await group.save();

        // Update all members to removed status
        await FamilyMember.updateMany(
            { groupId: group._id },
            { status: 'removed' }
        );

        // Cancel all pending invites
        await FamilyInvite.updateMany(
            { groupId: group._id, status: 'pending' },
            { status: 'cancelled' }
        );

        res.json({
            success: true,
            message: 'Family group deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete family group',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Generate or refresh invite code for a group
 * @route POST /api/family/groups/:groupId/invite-code
 */
export const generateInviteCode = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { expiryHours = 24 } = req.body;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check if user can invite
        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership || (!membership.canInvite() && !group.settings.allowMemberInvites)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to generate invite codes'
            });
        }

        await group.refreshInviteCode(Math.min(expiryHours, 168)); // Max 7 days

        res.json({
            success: true,
            message: 'Invite code generated successfully',
            data: {
                inviteCode: group.inviteCode,
                expiresAt: group.inviteCodeExpiresAt
            }
        });

    } catch (error) {
        console.error('Error generating invite code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invite code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Join a family group using invite code
 * @route POST /api/family/groups/join
 */
export const joinFamilyGroup = async (req, res) => {
    try {
        const { inviteCode, nickname, relationship } = req.body;
        const touristId = req.tourist._id;

        if (!inviteCode) {
            return res.status(400).json({
                success: false,
                message: 'Invite code is required'
            });
        }

        // Find group by invite code
        const group = await FamilyGroup.findOne({
            inviteCode: inviteCode.toUpperCase(),
            inviteCodeExpiresAt: { $gt: new Date() },
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invite code'
            });
        }

        // Check if already a member
        const existingMembership = await FamilyMember.findOne({
            groupId: group._id,
            touristId
        });

        if (existingMembership) {
            if (existingMembership.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of this group'
                });
            } else if (existingMembership.status === 'removed') {
                // Reactivate membership
                existingMembership.status = group.settings.requireApprovalToJoin ? 'pending' : 'active';
                existingMembership.nickname = nickname || existingMembership.nickname;
                existingMembership.relationship = relationship || existingMembership.relationship;
                await existingMembership.save();

                return res.json({
                    success: true,
                    message: group.settings.requireApprovalToJoin 
                        ? 'Request to rejoin sent. Waiting for approval.'
                        : 'Successfully rejoined the group',
                    data: {
                        groupId: group.groupId,
                        groupName: group.name,
                        status: existingMembership.status
                    }
                });
            }
        }

        // Check member limit (max 20 members per group)
        const memberCount = await FamilyMember.countDocuments({
            groupId: group._id,
            status: { $in: ['active', 'pending'] }
        });

        if (memberCount >= 20) {
            return res.status(400).json({
                success: false,
                message: 'This group has reached the maximum member limit'
            });
        }

        // Create new membership
        const newMember = new FamilyMember({
            groupId: group._id,
            touristId,
            role: 'member',
            nickname: nickname || req.tourist.personalInfo?.name,
            relationship: relationship || 'other',
            status: group.settings.requireApprovalToJoin ? 'pending' : 'active',
            settings: {
                shareLocation: group.settings.shareLocationByDefault,
                receiveAlerts: true,
                canViewOthersLocation: true
            }
        });

        await newMember.save();

        // Update group stats
        group.stats.totalMembers = memberCount + 1;
        if (newMember.status === 'active') {
            group.stats.activeMembers = (group.stats.activeMembers || 0) + 1;
        }
        await group.save();

        // Notify group admins about new member/request
        const adminMembers = await FamilyMember.find({
            groupId: group._id,
            role: { $in: ['admin', 'guardian'] },
            status: 'active'
        }).select('touristId');

        // TODO: Send notification via socket

        res.status(201).json({
            success: true,
            message: group.settings.requireApprovalToJoin 
                ? 'Join request sent. Waiting for approval.'
                : 'Successfully joined the family group',
            data: {
                groupId: group.groupId,
                groupName: group.name,
                status: newMember.status,
                role: newMember.role
            }
        });

    } catch (error) {
        console.error('Error joining family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join family group',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Invite a user to family group
 * @route POST /api/family/groups/:groupId/invite
 */
export const inviteToFamilyGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email, phone, touristId: targetTouristId, role, relationship, message } = req.body;
        const inviterTouristId = req.tourist._id;

        if (!email && !phone && !targetTouristId) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone number, or tourist ID is required'
            });
        }

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check permission
        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId: inviterTouristId,
            status: 'active'
        });

        if (!membership || (!membership.canInvite() && !group.settings.allowMemberInvites)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to invite members'
            });
        }

        // Determine invite type and target
        let inviteType, inviteTarget, targetTourist;

        if (targetTouristId) {
            inviteType = 'in_app';
            inviteTarget = targetTouristId;
            targetTourist = await Tourist.findById(targetTouristId);
            if (!targetTourist) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }
        } else if (email) {
            inviteType = 'email';
            inviteTarget = email.toLowerCase();
            targetTourist = await Tourist.findOne({ 'personalInfo.email': inviteTarget });
        } else if (phone) {
            inviteType = 'phone';
            inviteTarget = phone;
            targetTourist = await Tourist.findOne({ 'personalInfo.phone': phone });
        }

        // Check if target is already a member
        if (targetTourist) {
            const existingMember = await FamilyMember.findOne({
                groupId: group._id,
                touristId: targetTourist._id,
                status: { $in: ['active', 'pending'] }
            });

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'This user is already a member or has a pending invitation'
                });
            }
        }

        // Check for existing pending invite
        const existingInvite = await FamilyInvite.findOne({
            groupId: group._id,
            inviteTarget,
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'An invitation is already pending for this user'
            });
        }

        // Create invite
        const invite = new FamilyInvite({
            groupId: group._id,
            invitedBy: inviterTouristId,
            inviteType,
            inviteTarget,
            targetTouristId: targetTourist?._id,
            role: role || 'member',
            relationship: relationship || 'other',
            message,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await invite.save();

        // TODO: Send notification/email to target

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: {
                inviteId: invite._id,
                inviteCode: invite.inviteCode,
                inviteType,
                expiresAt: invite.expiresAt
            }
        });

    } catch (error) {
        console.error('Error inviting to family group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get pending invites for the user
 * @route GET /api/family/invites
 */
export const getMyInvites = async (req, res) => {
    try {
        const touristId = req.tourist._id;
        const tourist = req.tourist;

        // Find invites by tourist ID, email, or phone
        const invites = await FamilyInvite.find({
            $or: [
                { targetTouristId: touristId },
                { inviteTarget: tourist.personalInfo?.email?.toLowerCase() },
                { inviteTarget: tourist.personalInfo?.phone }
            ],
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate({
            path: 'groupId',
            select: 'groupId name description stats'
        }).populate({
            path: 'invitedBy',
            select: 'personalInfo.name digitalId'
        }).lean();

        res.json({
            success: true,
            data: {
                invites: invites.map(i => ({
                    inviteId: i._id,
                    inviteCode: i.inviteCode,
                    group: {
                        groupId: i.groupId?.groupId,
                        name: i.groupId?.name,
                        description: i.groupId?.description,
                        memberCount: i.groupId?.stats?.totalMembers
                    },
                    invitedBy: i.invitedBy?.personalInfo?.name,
                    role: i.role,
                    relationship: i.relationship,
                    message: i.message,
                    expiresAt: i.expiresAt,
                    createdAt: i.createdAt
                })),
                count: invites.length
            }
        });

    } catch (error) {
        console.error('Error getting invites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve invitations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Respond to an invite (accept/decline)
 * @route POST /api/family/invites/:inviteId/respond
 */
export const respondToInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const { accept, nickname } = req.body;
        const touristId = req.tourist._id;

        const invite = await FamilyInvite.findById(inviteId).populate('groupId');

        if (!invite || invite.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found or already responded'
            });
        }

        if (invite.expiresAt < new Date()) {
            invite.status = 'expired';
            await invite.save();
            return res.status(400).json({
                success: false,
                message: 'Invitation has expired'
            });
        }

        // Verify this invite is for the user
        const tourist = req.tourist;
        const isForUser = invite.targetTouristId?.toString() === touristId.toString() ||
            invite.inviteTarget === tourist.personalInfo?.email?.toLowerCase() ||
            invite.inviteTarget === tourist.personalInfo?.phone;

        if (!isForUser) {
            return res.status(403).json({
                success: false,
                message: 'This invitation is not for you'
            });
        }

        if (accept) {
            // Accept invite - create membership
            const newMember = new FamilyMember({
                groupId: invite.groupId._id,
                touristId,
                role: invite.role,
                nickname: nickname || tourist.personalInfo?.name,
                relationship: invite.relationship,
                status: 'active',
                invitedBy: invite.invitedBy,
                settings: {
                    shareLocation: invite.groupId.settings?.shareLocationByDefault ?? true,
                    receiveAlerts: true,
                    canViewOthersLocation: true
                }
            });

            await newMember.save();

            // Update invite status
            invite.status = 'accepted';
            invite.respondedAt = new Date();
            await invite.save();

            // Update group stats
            await FamilyGroup.findByIdAndUpdate(invite.groupId._id, {
                $inc: { 'stats.totalMembers': 1, 'stats.activeMembers': 1 }
            });

            res.json({
                success: true,
                message: 'Invitation accepted! You are now a member of the group.',
                data: {
                    groupId: invite.groupId.groupId,
                    groupName: invite.groupId.name,
                    role: newMember.role
                }
            });
        } else {
            // Decline invite
            invite.status = 'declined';
            invite.respondedAt = new Date();
            await invite.save();

            res.json({
                success: true,
                message: 'Invitation declined'
            });
        }

    } catch (error) {
        console.error('Error responding to invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to invitation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Approve or reject a pending member
 * @route POST /api/family/groups/:groupId/members/:memberId/approve
 */
export const approveMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const { approve } = req.body;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check if user is admin
        const adminMembership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            role: { $in: ['admin', 'guardian'] },
            status: 'active'
        });

        if (!adminMembership) {
            return res.status(403).json({
                success: false,
                message: 'Only admins or guardians can approve members'
            });
        }

        // Find pending member
        const pendingMember = await FamilyMember.findOne({
            _id: memberId,
            groupId: group._id,
            status: 'pending'
        }).populate('touristId', 'personalInfo.name digitalId');

        if (!pendingMember) {
            return res.status(404).json({
                success: false,
                message: 'Pending member not found'
            });
        }

        if (approve) {
            pendingMember.status = 'active';
            await pendingMember.save();

            await FamilyGroup.findByIdAndUpdate(group._id, {
                $inc: { 'stats.activeMembers': 1 }
            });

            res.json({
                success: true,
                message: 'Member approved successfully',
                data: {
                    memberId: pendingMember._id,
                    name: pendingMember.touristId?.personalInfo?.name
                }
            });
        } else {
            pendingMember.status = 'removed';
            await pendingMember.save();

            await FamilyGroup.findByIdAndUpdate(group._id, {
                $inc: { 'stats.totalMembers': -1 }
            });

            res.json({
                success: true,
                message: 'Member request rejected'
            });
        }

    } catch (error) {
        console.error('Error approving member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process member approval',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Remove a member from the group
 * @route DELETE /api/family/groups/:groupId/members/:memberId
 */
export const removeMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Find member to remove
        const memberToRemove = await FamilyMember.findOne({
            _id: memberId,
            groupId: group._id,
            status: 'active'
        });

        if (!memberToRemove) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Check permissions
        const requestingMember = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        const isSelfRemoval = memberToRemove.touristId.toString() === touristId.toString();
        const isAdmin = requestingMember?.role === 'admin';
        const isGuardianRemovingMember = requestingMember?.role === 'guardian' && 
            memberToRemove.role === 'member';

        // Can't remove the creator unless it's self-removal
        if (group.createdBy.toString() === memberToRemove.touristId.toString() && !isSelfRemoval) {
            return res.status(403).json({
                success: false,
                message: 'Cannot remove the group creator'
            });
        }

        if (!isSelfRemoval && !isAdmin && !isGuardianRemovingMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to remove this member'
            });
        }

        // Remove member
        memberToRemove.status = 'removed';
        await memberToRemove.save();

        // Update stats
        await FamilyGroup.findByIdAndUpdate(group._id, {
            $inc: { 'stats.totalMembers': -1, 'stats.activeMembers': -1 }
        });

        res.json({
            success: true,
            message: isSelfRemoval ? 'You have left the group' : 'Member removed successfully'
        });

    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove member',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Update member settings
 * @route PUT /api/family/groups/:groupId/members/me
 */
export const updateMyMemberSettings = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { nickname, settings } = req.body;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        if (nickname) membership.nickname = nickname.trim();
        if (settings) {
            membership.settings = {
                ...membership.settings,
                ...settings
            };
        }

        await membership.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                nickname: membership.nickname,
                settings: membership.settings
            }
        });

    } catch (error) {
        console.error('Error updating member settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get all family members' locations
 * @route GET /api/family/groups/:groupId/locations
 */
export const getFamilyLocations = async (req, res) => {
    try {
        const { groupId } = req.params;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Check membership and permission
        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        if (!membership.settings.canViewOthersLocation) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view locations'
            });
        }

        // Get all members who share location
        const members = await FamilyMember.find({
            groupId: group._id,
            status: 'active',
            'settings.shareLocation': true
        }).populate({
            path: 'touristId',
            select: 'personalInfo.name personalInfo.profilePicture digitalId currentLocation lastLocationUpdate status'
        }).lean();

        const locations = members
            .filter(m => m.touristId?.currentLocation?.coordinates)
            .map(m => ({
                memberId: m._id,
                touristId: m.touristId._id,
                name: m.nickname || m.touristId.personalInfo?.name,
                profilePicture: m.touristId.personalInfo?.profilePicture,
                role: m.role,
                relationship: m.relationship,
                location: {
                    latitude: m.touristId.currentLocation.coordinates[1],
                    longitude: m.touristId.currentLocation.coordinates[0],
                    lastUpdate: m.touristId.lastLocationUpdate,
                    address: m.touristId.currentLocation.address
                },
                status: m.touristId.status,
                isYou: m.touristId._id.toString() === touristId.toString()
            }));

        res.json({
            success: true,
            data: {
                groupId: group.groupId,
                groupName: group.name,
                locations,
                count: locations.length,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Error getting family locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve family locations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Share location with family group
 * @route POST /api/family/groups/:groupId/share-location
 */
export const shareLocationWithFamily = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { latitude, longitude, accuracy, batteryLevel } = req.body;
        const touristId = req.tourist._id;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        if (!membership.settings.shareLocation) {
            return res.status(400).json({
                success: false,
                message: 'Location sharing is disabled for your account'
            });
        }

        // Log location share
        const locationLog = new FamilyLocationLog({
            groupId: group._id,
            touristId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            accuracy,
            batteryLevel
        });

        await locationLog.save();

        // Update member's last location shared timestamp
        membership.lastLocationShared = new Date();
        await membership.save();

        // TODO: Broadcast to family group via socket

        res.json({
            success: true,
            message: 'Location shared with family group',
            data: {
                locationId: locationLog._id,
                timestamp: locationLog.timestamp
            }
        });

    } catch (error) {
        console.error('Error sharing location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share location',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Send SOS/emergency alert to family group
 * @route POST /api/family/groups/:groupId/sos
 */
export const sendFamilySOS = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { latitude, longitude, message, alertType = 'emergency' } = req.body;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Create family alert
        const familyAlert = new FamilyAlert({
            groupId: group._id,
            triggeredBy: touristId,
            alertType,
            severity: alertType === 'emergency' || alertType === 'sos' ? 'critical' : 'high',
            message: message || `${membership.nickname || req.tourist.personalInfo?.name} needs help!`,
            location: latitude && longitude ? {
                type: 'Point',
                coordinates: [longitude, latitude]
            } : undefined
        });

        await familyAlert.save();

        // Update group stats
        await FamilyGroup.findByIdAndUpdate(group._id, {
            $inc: { 'stats.totalAlerts': 1 }
        });

        // Get all members to notify
        const membersToNotify = await FamilyMember.find({
            groupId: group._id,
            status: 'active',
            'settings.receiveAlerts': true,
            touristId: { $ne: touristId } // Don't notify self
        }).populate('touristId', 'personalInfo.name firebaseUid');

        // TODO: Send push notifications and socket events to all members

        res.status(201).json({
            success: true,
            message: 'Emergency alert sent to family group',
            data: {
                alertId: familyAlert.alertId,
                notifiedMembers: membersToNotify.length,
                timestamp: familyAlert.createdAt
            }
        });

    } catch (error) {
        console.error('Error sending family SOS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send emergency alert',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get family alerts
 * @route GET /api/family/groups/:groupId/alerts
 */
export const getFamilyAlerts = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status, limit = 20, page = 1 } = req.query;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        const membership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const query = { groupId: group._id };
        if (status) {
            query.status = status;
        }

        const alerts = await FamilyAlert.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('triggeredBy', 'personalInfo.name digitalId')
            .lean();

        const total = await FamilyAlert.countDocuments(query);

        res.json({
            success: true,
            data: {
                alerts: alerts.map(a => ({
                    alertId: a.alertId,
                    type: a.alertType,
                    severity: a.severity,
                    message: a.message,
                    triggeredBy: a.triggeredBy?.personalInfo?.name,
                    location: a.location?.coordinates ? {
                        latitude: a.location.coordinates[1],
                        longitude: a.location.coordinates[0]
                    } : null,
                    status: a.status,
                    acknowledgedCount: a.acknowledgedBy?.length || 0,
                    createdAt: a.createdAt
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error getting family alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve alerts',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Acknowledge a family alert
 * @route POST /api/family/alerts/:alertId/acknowledge
 */
export const acknowledgeFamilyAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { response } = req.body;
        const touristId = req.tourist._id;

        const alert = await FamilyAlert.findOne({
            $or: [{ _id: alertId }, { alertId: alertId }]
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Verify membership
        const membership = await FamilyMember.findOne({
            groupId: alert.groupId,
            touristId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Check if already acknowledged
        const alreadyAcknowledged = alert.acknowledgedBy.some(
            a => a.touristId.toString() === touristId.toString()
        );

        if (alreadyAcknowledged) {
            return res.status(400).json({
                success: false,
                message: 'You have already acknowledged this alert'
            });
        }

        // Add acknowledgement
        alert.acknowledgedBy.push({
            touristId,
            acknowledgedAt: new Date(),
            response
        });

        // Update status if all members acknowledged
        const memberCount = await FamilyMember.countDocuments({
            groupId: alert.groupId,
            status: 'active',
            'settings.receiveAlerts': true
        });

        if (alert.acknowledgedBy.length >= memberCount - 1) { // -1 for the person who triggered
            alert.status = 'acknowledged';
        }

        await alert.save();

        res.json({
            success: true,
            message: 'Alert acknowledged',
            data: {
                alertId: alert.alertId,
                acknowledgedCount: alert.acknowledgedBy.length,
                status: alert.status
            }
        });

    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};

/**
 * Request check-in from a family member
 * @route POST /api/family/groups/:groupId/members/:memberId/request-checkin
 */
export const requestCheckIn = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const { message } = req.body;
        const touristId = req.tourist._id;

        const group = await FamilyGroup.findOne({
            $or: [{ _id: groupId }, { groupId: groupId }],
            isActive: true
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Family group not found'
            });
        }

        // Verify requester is a member
        const requesterMembership = await FamilyMember.findOne({
            groupId: group._id,
            touristId,
            status: 'active'
        });

        if (!requesterMembership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Find target member
        const targetMember = await FamilyMember.findOne({
            _id: memberId,
            groupId: group._id,
            status: 'active'
        }).populate('touristId', 'personalInfo.name firebaseUid');

        if (!targetMember) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Create check-in request alert
        const checkInAlert = new FamilyAlert({
            groupId: group._id,
            triggeredBy: touristId,
            alertType: 'check_in',
            severity: 'low',
            message: message || `${requesterMembership.nickname || req.tourist.personalInfo?.name} is requesting a check-in`
        });

        await checkInAlert.save();

        // TODO: Send push notification to target member

        res.json({
            success: true,
            message: 'Check-in request sent',
            data: {
                alertId: checkInAlert.alertId,
                targetMember: targetMember.touristId?.personalInfo?.name
            }
        });

    } catch (error) {
        console.error('Error requesting check-in:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send check-in request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
};
