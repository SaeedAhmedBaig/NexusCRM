const {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { EmailService } = require('../email/email.service');
const { RbacService } = require('./rbac.service');
const { getPlanLimits } = require('../../common/constants/plans');
const { ROLES, MANAGEMENT_ROLES } = require('../../common/constants/roles');
const { defineParamTypes } = require('../../common/define-param-types');

@Injectable()
class UsersService {
  userModel;
  userTenantModel;
  invitationModel;
  departmentModel;
  tenantModel;
  emailService;
  rbacService;
  configService;
  constructor(emailService, rbacService, configService) {
    this.emailService = emailService;
    this.rbacService = rbacService;
    this.configService = configService;
  }

  async listTenantUsers(tenantId, departmentId) {
    const filter = { tenantId, isActive: true };
    if (departmentId) filter.departmentId = departmentId;

    const members = await this.userTenantModel
      .find(filter)
      .populate('userId', 'email name lastLogin isActive emailVerified')
      .populate('departmentId', 'name')
      .lean();

    return members.map((m) => ({
      id: m._id,
      userId: m.userId?._id,
      email: m.userId?.email,
      name: m.userId?.name,
      role: m.role,
      department: m.departmentId,
      permissions: m.permissions,
      lastLogin: m.userId?.lastLogin,
      emailVerified: m.userId?.emailVerified,
    }));
  }

  async inviteUser(tenantId, inviterId, { email, role, departmentId }) {
    if (role === ROLES.OWNER) {
      throw new BadRequestException('Cannot invite as owner');
    }

    const tenant = await this.tenantModel.findById(tenantId).lean();
    const limits = getPlanLimits(tenant?.plan);
    if (limits.users > 0) {
      const activeCount = await this.userTenantModel.countDocuments({ tenantId, isActive: true });
      const pendingCount = await this.invitationModel.countDocuments({ tenantId, status: 'pending' });
      if (activeCount + pendingCount >= limits.users) {
        throw new BadRequestException(`User limit reached for ${tenant?.plan} plan (${limits.users})`);
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingMember = await this.userTenantModel
      .findOne({ tenantId })
      .populate({ path: 'userId', match: { email: normalizedEmail } });

    if (existingMember?.userId) {
      throw new ConflictException('User already belongs to this tenant');
    }

    const pending = await this.invitationModel.findOne({
      tenantId,
      email: normalizedEmail,
      status: 'pending',
    });
    if (pending) {
      throw new ConflictException('Invitation already pending for this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await this.invitationModel.create({
      email: normalizedEmail,
      tenantId,
      role: role || ROLES.CO_WORKER,
      departmentId: departmentId || null,
      invitedBy: inviterId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const inviteUrl = `${appUrl}/invite/${token}`;

    await this.emailService.inviteEmail({
      to: normalizedEmail,
      tenantName: tenant?.name || 'Workspace',
      inviteUrl,
      role: invitation.role,
    });

    return { id: invitation._id, email: invitation.email, role: invitation.role, status: invitation.status };
  }

  async updateMember(tenantId, memberId, actorRole, updates) {
    const membership = await this.userTenantModel.findOne({ _id: memberId, tenantId });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === ROLES.OWNER && actorRole !== ROLES.OWNER) {
      throw new ForbiddenException('Only owner can modify owner accounts');
    }

    if (updates.role) {
      if (updates.role === ROLES.OWNER && actorRole !== ROLES.OWNER) {
        throw new ForbiddenException('Cannot assign owner role');
      }
      membership.role = updates.role;
      const group = await this.rbacService.findGroupByRole(tenantId, updates.role);
      membership.groupId = group?._id || null;
    }

    if (updates.departmentId !== undefined) {
      if (updates.departmentId) {
        const dept = await this.departmentModel.findOne({
          _id: updates.departmentId,
          tenantId,
        });
        if (!dept) throw new NotFoundException('Department not found');
      }
      membership.departmentId = updates.departmentId || null;
    }

    if (updates.permissions) membership.permissions = updates.permissions;

    if (updates.isActive !== undefined) {
      if (membership.role === ROLES.OWNER) {
        throw new ForbiddenException('Cannot suspend owner');
      }
      membership.isActive = Boolean(updates.isActive);
    }

    await membership.save();
    return {
      id: membership._id,
      role: membership.role,
      departmentId: membership.departmentId,
      isActive: membership.isActive,
    };
  }

  async removeMember(tenantId, memberId, actorRole) {
    const membership = await this.userTenantModel.findOne({ _id: memberId, tenantId });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === ROLES.OWNER) {
      throw new ForbiddenException('Cannot remove owner');
    }

    if (membership.role === ROLES.ADMIN && actorRole !== ROLES.OWNER) {
      throw new ForbiddenException('Only owner can remove admins');
    }

    membership.isActive = false;
    await membership.save();
    return { removed: true };
  }

  async acceptInvite({ token, name, password }) {
    const invitation = await this.invitationModel.findOne({ token, status: 'pending' });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new BadRequestException('Invitation expired');
    }

    let user = await this.userModel.findOne({ email: invitation.email });
    if (!user) {
      if (!name || !password) {
        throw new BadRequestException('Name and password required for new users');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      user = await this.userModel.create({
        email: invitation.email,
        name,
        passwordHash,
        emailVerified: true,
      });
    }

    const existing = await this.userTenantModel.findOne({
      userId: user._id,
      tenantId: invitation.tenantId,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.role = invitation.role;
        existing.departmentId = invitation.departmentId;
        await existing.save();
      }
    } else {
      const group = await this.rbacService.findGroupByRole(invitation.tenantId, invitation.role);
      await this.userTenantModel.create({
        userId: user._id,
        tenantId: invitation.tenantId,
        role: invitation.role,
        departmentId: invitation.departmentId,
        groupId: group?._id || null,
      });
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    const tenant = await this.tenantModel.findById(invitation.tenantId).lean();
    return {
      user: { id: user._id, email: user.email, name: user.name },
      tenant,
      role: invitation.role,
    };
  }
}

defineParamTypes(UsersService, EmailService, RbacService, ConfigService);

module.exports = { UsersService };
