const { Injectable } = require('@nestjs/common');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../common/constants/roles');
const { PLANS, TENANT_STATUSES } = require('../../common/constants/plans');
const { defineParamTypes } = require('../../common/define-param-types');

/**
 * Ensures the platform superadmin account exists on startup.
 * Credentials come from SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD in .env.
 * No signup required — the system provisions the account automatically.
 */
@Injectable()
class SuperadminBootstrapService {
  userModel;
  userTenantModel;
  tenantModel;
  onboardingService;
  rbacService;
  configService;

  constructor(onboardingService, rbacService, configService) {
    this.onboardingService = onboardingService;
    this.rbacService = rbacService;
    this.configService = configService;
  }

  async ensureSuperadmin() {
    const email = (this.configService.get('SUPERADMIN_EMAIL') || '').toLowerCase().trim();
    const password = this.configService.get('SUPERADMIN_PASSWORD');
    const subdomain = (this.configService.get('SUPERADMIN_TENANT_SUBDOMAIN') || 'system').toLowerCase().trim();

    if (!email || !password) {
      console.warn('[Superadmin] Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env');
      return;
    }

    let tenant = await this.tenantModel.findOne({ subdomain });
    if (!tenant) {
      tenant = await this.tenantModel.create({
        name: 'NexusCRM Platform',
        subdomain,
        plan: PLANS.ENTERPRISE,
        status: TENANT_STATUSES.ACTIVE,
        onboardingCompleted: true,
        settings: { isSystemTenant: true },
      });
      await this.onboardingService.seedDefaults(tenant._id);
      console.log(`[Superadmin] System tenant ready (${subdomain})`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user = await this.userModel.findOne({ email });

    if (!user) {
      const ownerGroup = await this.rbacService.findGroupByRole(tenant._id, ROLES.OWNER);
      user = await this.userModel.create({
        email,
        passwordHash,
        name: 'Platform Superadmin',
        isSuperadmin: true,
        emailVerified: true,
      });
      await this.userTenantModel.create({
        userId: user._id,
        tenantId: tenant._id,
        role: ROLES.OWNER,
        groupId: ownerGroup?._id || null,
        isActive: true,
      });
      console.log(`[Superadmin] Default account created (${email})`);
      return;
    }

    user.passwordHash = passwordHash;
    user.isSuperadmin = true;
    user.emailVerified = true;
    await user.save();

    const membership = await this.userTenantModel.findOne({
      userId: user._id,
      tenantId: tenant._id,
      isActive: true,
    });
    if (!membership) {
      const ownerGroup = await this.rbacService.findGroupByRole(tenant._id, ROLES.OWNER);
      await this.userTenantModel.create({
        userId: user._id,
        tenantId: tenant._id,
        role: ROLES.OWNER,
        groupId: ownerGroup?._id || null,
        isActive: true,
      });
    }

    console.log(`[Superadmin] Default account synced (${email})`);
  }
}

defineParamTypes(
  SuperadminBootstrapService,
  require('../tenant/onboarding.service').OnboardingService,
  require('../rbac/rbac.service').RbacService,
  require('@nestjs/config').ConfigService,
);

module.exports = { SuperadminBootstrapService };
