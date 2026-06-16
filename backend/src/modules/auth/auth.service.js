const {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { TenantService } = require('../tenant/tenant.service');
const { RbacService } = require('../rbac/rbac.service');
const { UsersService } = require('../rbac/users.service');
const { EmailService } = require('../email/email.service');
const { ROLES } = require('../../common/constants/roles');
const { PLANS } = require('../../common/constants/plans');
const { verifyRecaptcha } = require('../../common/utils/recaptcha');
const { OnboardingService } = require('../tenant/onboarding.service');
const { defineParamTypes } = require('../../common/define-param-types');

const PLAN_MAP = {
  free: PLANS.STARTER,
  starter: PLANS.STARTER,
  pro: PLANS.PROFESSIONAL,
  professional: PLANS.PROFESSIONAL,
  business: PLANS.BUSINESS,
  enterprise: PLANS.ENTERPRISE,
};

const OTP_EXPIRY_MS = 15 * 60 * 1000;

@Injectable()
class AuthService {
  userModel;
  userTenantModel;
  activityEventModel;
  notificationModel;
  tenantService;
  rbacService;
  usersService;
  emailService;
  onboardingService;
  jwtService;
  configService;

  constructor(tenantService, rbacService, usersService, emailService, onboardingService, jwtService, configService) {
    this.tenantService = tenantService;
    this.rbacService = rbacService;
    this.usersService = usersService;
    this.emailService = emailService;
    this.onboardingService = onboardingService;
    this.jwtService = jwtService;
    this.configService = configService;
  }

  async signup(body) {
    const {
      email,
      password,
      companyName,
      tenantName,
      subdomain,
      plan = 'free',
      recaptchaToken,
      name,
    } = body;

    const resolvedName = name || companyName || tenantName;
    const resolvedCompany = companyName || tenantName;

    if (!email || !password || !resolvedCompany || !subdomain) {
      throw new BadRequestException('Email, password, company name, and subdomain are required');
    }

    const recaptchaSecret = this.configService.get('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret) {
      const valid = await verifyRecaptcha(recaptchaToken, recaptchaSecret);
      if (!valid) throw new BadRequestException('reCAPTCHA verification failed');
    }

    return this.register({
      email,
      password,
      name: resolvedName,
      tenantName: resolvedCompany,
      subdomain,
      plan: PLAN_MAP[plan?.toLowerCase()] || PLANS.STARTER,
    });
  }

  async register({ email, password, name, tenantName, subdomain, plan = PLANS.STARTER }) {
    if (!email || !password || !name || !tenantName || !subdomain) {
      throw new BadRequestException('All fields are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const superadminEmail = this.configService.get('SUPERADMIN_EMAIL', '').toLowerCase().trim();
    if (superadminEmail && normalizedEmail === superadminEmail) {
      throw new ConflictException('This email is reserved for platform administration');
    }

    const existingUser = await this.userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    let tenant;
    try {
      tenant = await this.tenantService.create({ name: tenantName, subdomain, plan });
      await this.onboardingService.seedDefaults(tenant._id);
      const ownerGroup = await this.rbacService.findGroupByRole(tenant._id, ROLES.OWNER);

      const passwordHash = await bcrypt.hash(password, 10);
      const superadminEmail = this.configService.get('SUPERADMIN_EMAIL', '').toLowerCase();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const otp = this.generateOtp();
      const otpHash = this.hashOtp(otp);
      const verificationExpires = new Date(Date.now() + OTP_EXPIRY_MS);

      const user = await this.userModel.create({
        email: normalizedEmail,
        passwordHash,
        name,
        isSuperadmin: superadminEmail && normalizedEmail === superadminEmail,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        emailVerificationOtpHash: otpHash,
      });

      await this.userTenantModel.create({
        userId: user._id,
        tenantId: tenant._id,
        role: ROLES.OWNER,
        groupId: ownerGroup?._id || null,
      });

      await this.createNotification(tenant._id, user._id, {
        type: 'trial.started',
        title: 'Trial started',
        body: tenant.trialEndsAt
          ? `Your ${tenant.plan} trial is active until ${new Date(tenant.trialEndsAt).toLocaleDateString()}.`
          : `Your ${tenant.plan} trial is active.`,
        href: '/settings/billing',
        entityType: 'Tenant',
        entityId: tenant._id,
      });

      let verificationDelivery;
      try {
        verificationDelivery = await this.sendVerificationEmail(user, tenant, otp);
      } catch {
        if (this.isEmailVerificationRequired()) {
          throw new BadRequestException('Could not send verification email. Check your email provider settings.');
        }
      }

      if (verificationDelivery?.skipped) {
        if (this.isEmailVerificationRequired()) {
          throw new BadRequestException('Email verification is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        user.emailVerificationOtpHash = null;
        await user.save();

        return this.buildAuthResponse(user, tenant, ROLES.OWNER);
      }

      return {
        requiresVerification: true,
        email: user.email,
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
        },
      };
    } catch (error) {
      if (tenant?._id) {
        await this.onboardingService.rollbackTenant(tenant._id);
        await this.userTenantModel.deleteMany({ tenantId: tenant._id });
        await this.userModel.deleteOne({ email: normalizedEmail });
      }
      throw error;
    }
  }

  async login({ email, password, tenantId, subdomain }) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    if (!tenantId && !subdomain) {
      throw new BadRequestException('tenantId or subdomain is required');
    }

    const user = await this.validateUserCredentials(email, password);

    if (!user.emailVerified && !user.isSuperadmin) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }

    let tenant;
    if (tenantId) {
      tenant = await this.tenantService.findById(tenantId);
    } else {
      tenant = await this.tenantService.findBySubdomain(subdomain);
    }

    if (tenant.status === 'suspended') {
      throw new UnauthorizedException('This workspace is suspended');
    }

    const membership = await this.userTenantModel.findOne({
      userId: user._id,
      tenantId: tenant._id,
      isActive: true,
    });

    if (!membership) {
      throw new UnauthorizedException('You do not have access to this tenant');
    }

    user.lastLogin = new Date();
    await user.save();
    await this.recordSecurityEvent(tenant._id, user._id, 'login_success', 'User signed in', {
      email: user.email,
      role: membership.role,
    });

    return this.buildAuthResponse(user, tenant, membership.role);
  }

  async superadminLogin({ email, password }) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.validateUserCredentials(email, password);
    if (!user.isSuperadmin) {
      throw new ForbiddenException('Superadmin access required');
    }

    const subdomain = this.configService.get('SUPERADMIN_TENANT_SUBDOMAIN', 'system').toLowerCase().trim();
    const tenant = await this.tenantService.findBySubdomain(subdomain);
    if (tenant.status === 'suspended') {
      throw new UnauthorizedException('System workspace is suspended');
    }

    const membership = await this.userTenantModel.findOne({
      userId: user._id,
      tenantId: tenant._id,
      isActive: true,
    });
    if (!membership) {
      throw new UnauthorizedException('Superadmin system workspace is not configured');
    }

    user.lastLogin = new Date();
    await user.save();
    await this.recordSecurityEvent(tenant._id, user._id, 'superadmin_login_success', 'Superadmin signed in', {
      email: user.email,
      role: membership.role,
    });

    return this.buildAuthResponse(user, tenant, membership.role);
  }

  async discoverTenants({ email, password }) {
    const user = await this.validateUserCredentials(email, password);
    if (!user.emailVerified && !user.isSuperadmin) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }
    const memberships = await this.userTenantModel
      .find({ userId: user._id, isActive: true })
      .populate('tenantId', 'name subdomain plan status')
      .lean();

    return memberships
      .filter((m) => m.tenantId && m.tenantId.status !== 'suspended')
      .map((m) => ({
        tenantId: m.tenantId._id.toString(),
        name: m.tenantId.name,
        subdomain: m.tenantId.subdomain,
        plan: m.tenantId.plan,
        role: m.role,
      }));
  }

  async myTenants(userId) {
    const memberships = await this.userTenantModel
      .find({ userId, isActive: true })
      .populate('tenantId', 'name subdomain plan status')
      .lean();

    return memberships
      .filter((m) => m.tenantId)
      .map((m) => ({
        tenantId: m.tenantId._id.toString(),
        name: m.tenantId.name,
        subdomain: m.tenantId.subdomain,
        plan: m.tenantId.plan,
        role: m.role,
      }));
  }

  async switchTenant(userId, tenantId) {
    const membership = await this.userTenantModel.findOne({ userId, tenantId, isActive: true });
    if (!membership) {
      throw new UnauthorizedException('You do not have access to this tenant');
    }

    const user = await this.userModel.findById(userId);
    const tenant = await this.tenantService.findById(tenantId);
    if (tenant.status === 'suspended') {
      throw new UnauthorizedException('This workspace is suspended');
    }
    await this.recordSecurityEvent(tenant._id, user._id, 'tenant_switched', 'User switched tenant', {
      email: user.email,
      role: membership.role,
    });
    return this.buildAuthResponse(user, tenant, membership.role);
  }

  async assertTenantActive(tenantId) {
    const tenant = await this.tenantService.findById(tenantId);
    if (tenant.status === 'suspended') {
      throw new ForbiddenException('This workspace is suspended');
    }
    return tenant;
  }

  async getProfile(userId, tenantId) {
    const { rules, membership, group } = await this.rbacService.getAbilityForUser(userId, tenantId);
    const user = await this.userModel.findById(userId).lean();
    const tenant = await this.tenantService.findById(tenantId);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: membership.role,
        emailVerified: user.emailVerified,
        departmentId: membership.departmentId,
        avatarUrl: user.avatarUrl || null,
        language: user.language || 'en',
        preferences: user.preferences || {},
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || null,
        plan: tenant.plan,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt || null,
        billingPeriodEnd: tenant.billingPeriodEnd || null,
        defaultDepartmentId: tenant.defaultDepartmentId || null,
        onboardingCompleted: Boolean(tenant.onboardingCompleted),
        settings: tenant.settings || {},
      },
      permissions: [...(group?.permissions || []), ...(membership.permissions || [])],
      rules,
    };
  }

  async updateProfile(userId, tenantId, body) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (body.name) user.name = body.name.trim();
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl || null;
    if (body.language) user.language = body.language;

    if (body.preferences) {
      user.preferences = { ...(user.preferences || {}), ...body.preferences };
    }

    if (body.email && body.email.toLowerCase().trim() !== user.email) {
      const taken = await this.userModel.findOne({ email: body.email.toLowerCase().trim() });
      if (taken) throw new ConflictException('Email is already in use');
      user.email = body.email.toLowerCase().trim();
      user.emailVerified = false;
    }

    if (body.password) {
      if (!body.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
      user.passwordHash = await bcrypt.hash(body.password, 10);
    }

    await user.save();
    return this.getProfile(userId, tenantId);
  }

  async verifyEmail(token) {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    return this.completeEmailVerification(user);
  }

  async verifyOtp({ email, otp }) {
    if (!email || !otp) {
      throw new BadRequestException('Email and verification code are required');
    }

    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
      emailVerified: false,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user || !user.emailVerificationOtpHash || !this.verifyOtpHash(String(otp).trim(), user.emailVerificationOtpHash)) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return this.completeEmailVerification(user);
  }

  async resendVerification(email) {
    const normalized = email?.toLowerCase().trim();
    if (!normalized) throw new BadRequestException('Email is required');

    const user = await this.userModel.findOne({ email: normalized, emailVerified: false, isActive: true });
    if (!user) return { sent: true };

    const membership = await this.userTenantModel
      .findOne({ userId: user._id, isActive: true })
      .populate('tenantId', 'name subdomain')
      .lean();

    const otp = this.generateOtp();
    user.emailVerificationOtpHash = this.hashOtp(otp);
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    try {
      await this.sendVerificationEmail(user, membership?.tenantId, otp);
    } catch {
      throw new BadRequestException('Could not send verification email. Try again shortly.');
    }

    return { sent: true };
  }

  async completeEmailVerification(user) {
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationOtpHash = null;
    await user.save();

    const membership = await this.userTenantModel
      .findOne({ userId: user._id, isActive: true })
      .sort({ createdAt: 1 });

    if (!membership) {
      return { verified: true };
    }

    const tenant = await this.tenantService.findById(membership.tenantId);

    try {
      await this.sendWelcomeEmail(user, tenant);
    } catch {
      /* welcome email is best-effort */
    }

    return this.buildAuthResponse(user, tenant, membership.role);
  }

  async forgotPassword(email) {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim(), isActive: true });
    if (!user) return { sent: true };

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const membership = await this.userTenantModel.findOne({ userId: user._id, isActive: true }).lean();
    if (membership?.tenantId) {
      await this.recordSecurityEvent(membership.tenantId, user._id, 'password_reset_requested', 'Password reset requested', { email: user.email });
    }

    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    try {
      await this.emailService.resetPasswordEmail({
        to: user.email,
        name: user.name,
        resetUrl: `${appUrl}/reset-password?token=${token}`,
      });
    } catch {
      throw new BadRequestException('Could not send reset email. Try again shortly.');
    }

    return { sent: true };
  }

  async resetPassword({ token, password }) {
    if (!token || !password) throw new BadRequestException('Token and password required');
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    const membership = await this.userTenantModel.findOne({ userId: user._id, isActive: true }).lean();
    if (membership?.tenantId) {
      await this.recordSecurityEvent(membership.tenantId, user._id, 'password_reset_completed', 'Password reset completed', { email: user.email });
    }

    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    try {
      await this.emailService.passwordChangedEmail({
        to: user.email,
        name: user.name,
        loginUrl: `${appUrl}/login`,
      });
    } catch {
      /* best-effort */
    }

    return { reset: true };
  }

  async acceptInvite(payload) {
    return this.usersService.acceptInvite(payload);
  }

  async validateMembership(userId, tenantId) {
    return this.userTenantModel.findOne({ userId, tenantId, isActive: true }).lean();
  }

  async validateUserCredentials(email, password) {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      await this.recordSecurityEvent(null, null, 'login_failed', 'Login failed for unknown or inactive user', { email });
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const membership = await this.userTenantModel.findOne({ userId: user._id, isActive: true }).lean();
      await this.recordSecurityEvent(membership?.tenantId, user._id, 'login_failed', 'Login failed due to invalid password', { email: user.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async recordSecurityEvent(tenantId, userId, action, summary, metadata = {}) {
    if (!this.activityEventModel || !tenantId) return;
    try {
      await this.activityEventModel.create({
        tenantId,
        actorId: userId || null,
        actorName: metadata.email || 'System',
        action,
        source: 'auth',
        severity: action.includes('failed') ? 'medium' : 'info',
        entityType: 'User',
        entityId: userId || tenantId,
        entityName: metadata.email || 'Authentication',
        summary,
        visibility: 'internal',
        metadata,
      });
    } catch {
      /* Security audit is best-effort and must not block auth. */
    }
  }

  async buildAuthResponse(user, tenant, role) {
    const { rules } = await this.rbacService.getAbilityForUser(user._id, tenant._id);

    const token = this.signToken({
      sub: user._id.toString(),
      email: user.email,
      tenantId: tenant._id.toString(),
      role,
      isSuperadmin: user.isSuperadmin,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role,
        isSuperadmin: Boolean(user.isSuperadmin),
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt || null,
        billingPeriodEnd: tenant.billingPeriodEnd || null,
        onboardingCompleted: Boolean(tenant.onboardingCompleted),
      },
      role,
      rules,
    };
  }

  generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  hashOtp(otp) {
    const secret = this.configService.get('JWT_SECRET', 'dev-secret-change-me');
    return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
  }

  verifyOtpHash(otp, hash) {
    return hash && this.hashOtp(otp) === hash;
  }

  isEmailVerificationRequired() {
    return this.configService.get('NODE_ENV') !== 'development';
  }

  async sendVerificationEmail(user, tenant, otp) {
    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const tenantName = tenant?.name || tenant?.tenantId?.name;
    const verifyUrl = `${appUrl}/verify-email?token=${user.emailVerificationToken}`;

    return this.emailService.otpEmail({
      to: user.email,
      name: user.name,
      otp,
      verifyUrl,
      expiresMinutes: 15,
      tenantName,
    });
  }

  async sendWelcomeEmail(user, tenant) {
    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const loginUrl = `${appUrl}/${tenant.subdomain}/onboarding`;
    await this.emailService.welcomeEmail({
      to: user.email,
      name: user.name,
      tenantName: tenant.name,
      loginUrl,
    });
  }

  signToken(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'dev-secret-change-me'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });
  }

  async createNotification(tenantId, userId, payload) {
    if (!this.notificationModel) return null;
    return this.notificationModel.create({
      tenantId,
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body || '',
      href: payload.href || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      read: false,
    });
  }
}

defineParamTypes(
  AuthService,
  TenantService,
  RbacService,
  UsersService,
  EmailService,
  OnboardingService,
  JwtService,
  ConfigService,
);

module.exports = { AuthService };
