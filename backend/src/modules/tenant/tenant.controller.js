const { Controller, Get, Bind, Param } = require('@nestjs/common');
const { SuperadminOnly } = require('../../common/decorators/superadmin.decorator');
const { Public } = require('../../common/decorators/public.decorator');
const { TenantService } = require('./tenant.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('tenants')
class TenantController {
  tenantService;

  constructor(tenantService) {
    this.tenantService = tenantService;
  }

  @Public()
  @Get('resolve/:subdomain')
  @Bind(Param('subdomain'))
  async resolve(subdomain) {
    const tenant = await this.tenantService.findBySubdomain(subdomain);
    return {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      status: tenant.status,
    };
  }

  @SuperadminOnly()
  @Get()
  async listAll() {
    const tenants = await this.tenantService.findAll();
    return tenants.map((t) => ({
      id: t._id,
      name: t.name,
      subdomain: t.subdomain,
      customDomain: t.customDomain,
      plan: t.plan,
      status: t.status,
      createdAt: t.createdAt,
    }));
  }
}

defineParamTypes(TenantController, TenantService);

module.exports = { TenantController };
