const {
  Injectable,
  ForbiddenException,
  BadRequestException,
} = require('@nestjs/common');
const { UsersService } = require('../rbac/users.service');
const { RbacService } = require('../rbac/rbac.service');
const { ROLES } = require('../../common/constants/roles');
const { defineParamTypes } = require('../../common/define-param-types');

const crypto = require('crypto');
const { DEFAULT_FORM_FIELDS } = require('../crm/schemas/lead-source.schema');

const DEFAULT_LEAD_SOURCES = ['Website', 'Referral', 'Cold call', 'Trade show', 'Partner'];

@Injectable()
class OnboardingService {
  tenantModel;
  departmentModel;
  leadSourceModel;
  usersService;
  rbacService;

  constructor(usersService, rbacService) {
    this.usersService = usersService;
    this.rbacService = rbacService;
  }

  async seedDefaults(tenantId) {
    await this.rbacService.seedDefaultGroups(tenantId);

    const deptCount = await this.departmentModel.countDocuments({ tenantId });
    if (deptCount === 0) {
      await this.departmentModel.create({
        tenantId,
        name: 'Sales',
        description: 'Default sales department',
      });
    }

    const sourceCount = await this.leadSourceModel.countDocuments({ tenantId });
    if (sourceCount === 0) {
      await this.leadSourceModel.insertMany(
        DEFAULT_LEAD_SOURCES.map((name, i) => ({
          tenantId,
          name,
          isDefault: i === 0,
          embedToken: crypto.randomUUID(),
          formFields: DEFAULT_FORM_FIELDS,
        })),
      );
    }
  }

  async completeOnboarding(tenantId, userId, payload) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new BadRequestException('Tenant not found');

    const {
      company = {},
      departments = [],
      invites = [],
      emailAccount = {},
      skippedSteps = [],
    } = payload;

    const settings = {
      ...tenant.settings,
      company: {
        logoUrl: company.logoUrl || null,
        address: company.address || '',
        phone: company.phone || '',
        website: company.website || '',
      },
      emailAccount: {
        configured: Boolean(emailAccount.configured),
        skipped: Boolean(emailAccount.skipped),
        provider: emailAccount.provider || null,
        host: emailAccount.host || null,
        port: emailAccount.port || null,
        username: emailAccount.username || null,
      },
      themeColor: '#FD4B23',
      skippedSteps,
      onboardingCompletedAt: new Date().toISOString(),
    };

    if (departments.length) {
      for (const dept of departments) {
        if (!dept.name) continue;
        const exists = await this.departmentModel.findOne({ tenantId, name: dept.name });
        if (!exists) {
          await this.departmentModel.create({
            tenantId,
            name: dept.name,
            description: dept.description || '',
          });
        }
      }
    }

    for (const invite of invites) {
      if (!invite.email) continue;
      try {
        await this.usersService.inviteUser(tenantId, userId, {
          email: invite.email,
          role: invite.role || ROLES.CO_WORKER,
          departmentId: invite.departmentId || null,
        });
      } catch {
        /* ignore duplicate invites during onboarding */
      }
    }

    tenant.settings = settings;
    tenant.onboardingCompleted = true;
    if (company.name) tenant.name = company.name;
    await tenant.save();

    return {
      completed: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        onboardingCompleted: tenant.onboardingCompleted,
        settings: tenant.settings,
      },
    };
  }

  async getOnboardingStatus(tenantId) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant) throw new BadRequestException('Tenant not found');
    return {
      onboardingCompleted: tenant.onboardingCompleted,
      settings: tenant.settings,
    };
  }

  async rollbackTenant(tenantId) {
    await this.departmentModel.deleteMany({ tenantId });
    await this.leadSourceModel.deleteMany({ tenantId });
    await this.rbacService.deleteTenantData(tenantId);
    await this.tenantModel.findByIdAndDelete(tenantId);
  }
}

defineParamTypes(OnboardingService, UsersService, RbacService);

module.exports = { OnboardingService };
