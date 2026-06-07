const { Injectable, NestMiddleware } = require('@nestjs/common');
const { TenantService } = require('../../modules/tenant/tenant.service');
const { defineParamTypes } = require('../define-param-types');

@Injectable()
class TenantMiddleware {
  tenantService;

  constructor(tenantService) {
    this.tenantService = tenantService;
  }

  async use(req, res, next) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    let tenant = await this.tenantService.resolveFromHost(host);

    if (!tenant && req.headers['x-tenant-subdomain']) {
      try {
        tenant = await this.tenantService.findBySubdomain(String(req.headers['x-tenant-subdomain']));
      } catch {
        tenant = null;
      }
    }

    if (tenant) {
      req.tenant = tenant;
      req.tenantId = tenant._id.toString();
      req.tenantSubdomain = tenant.subdomain;
    }

    next();
  }
}

defineParamTypes(TenantMiddleware, TenantService);

module.exports = { TenantMiddleware };
