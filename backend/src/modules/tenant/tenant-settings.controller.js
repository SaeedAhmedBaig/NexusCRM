const { Controller, Get, Put, Bind, Body, Req, UseGuards } = require('@nestjs/common');
const { TenantService } = require('./tenant.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { Roles } = require('../../common/decorators/roles.decorator');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { ROLES } = require('../../common/constants/roles');
const { canManageSettings } = require('../../common/policies/policy-handlers');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('tenants/settings')
@UseGuards(RolesGuard, PoliciesGuard)
class TenantSettingsController {
  tenantService;

  constructor(tenantService) {
    this.tenantService = tenantService;
  }

  @Get()
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Req())
  async getSettings(req) {
    const tenant = await this.tenantService.findById(req.tenantId);
    return {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || null,
      plan: tenant.plan,
      defaultDepartmentId: tenant.defaultDepartmentId || null,
      settings: tenant.settings || {},
    };
  }

  @Put()
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Body(), Req())
  async updateSettings(body, req) {
    const tenant = await this.tenantService.updateSettings(req.tenantId, req.user.role, body);
    return {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || null,
      plan: tenant.plan,
      defaultDepartmentId: tenant.defaultDepartmentId || null,
      settings: tenant.settings || {},
    };
  }
}

defineParamTypes(TenantSettingsController, TenantService);

module.exports = { TenantSettingsController };
