const { Controller, Get, Patch, Post, Bind, Req, Body, Query, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { SecurityService } = require('./security.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canManageSecurity } = require('../../common/policies/policy-handlers');

@Controller('security')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canManageSecurity)
class SecurityController {
  securityService;

  constructor(securityService) {
    this.securityService = securityService;
  }

  @Get('overview')
  @Bind(Req())
  overview(req) {
    return this.securityService.overview(req.tenantId);
  }

  @Patch('policy')
  @Bind(Body(), Req())
  updatePolicy(body, req) {
    return this.securityService.updatePolicy(req.tenantId, req.user.id, body);
  }

  @Get('events')
  @Bind(Req(), Query())
  events(req, query) {
    return this.securityService.listEvents(req.tenantId, query);
  }

  @Post('audit-export')
  @Bind(Body(), Req())
  auditExport(body, req) {
    return this.securityService.queueAuditExport(req.tenantId, req.user.id, body);
  }
}

defineParamTypes(SecurityController, SecurityService);

module.exports = { SecurityController };
