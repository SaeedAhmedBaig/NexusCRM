const { Controller, Get, Post, Put, Patch, Bind, Body, Query, Param } = require('@nestjs/common');
const { SuperadminOnly } = require('../../common/decorators/superadmin.decorator');
const { SuperadminService } = require('./superadmin.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('superadmin')
@SuperadminOnly()
class SuperadminController {
  superadminService;

  constructor(superadminService) {
    this.superadminService = superadminService;
  }

  @Get('tenants')
  @Bind(Query())
  listTenants(query) {
    return this.superadminService.listTenants(query);
  }

  @Get('tenants/:id')
  @Bind(Param('id'))
  getTenant(id) {
    return this.superadminService.getTenantDetail(id);
  }

  @Post('tenants/:id/suspend')
  @Bind(Param('id'))
  suspend(id) {
    return this.superadminService.suspendTenant(id);
  }

  @Post('tenants/:id/activate')
  @Bind(Param('id'))
  activate(id) {
    return this.superadminService.activateTenant(id);
  }

  @Patch('tenants/:id/plan')
  @Bind(Param('id'), Body())
  changePlan(id, body) {
    return this.superadminService.changePlan(id, body.plan);
  }

  @Patch('tenants/:id/lifecycle')
  @Bind(Param('id'), Body())
  updateLifecycle(id, body) {
    return this.superadminService.updateTenantLifecycle(id, body);
  }

  @Post('tenants/:id/users/:userId/password')
  @Bind(Param('id'), Param('userId'), Body())
  resetTenantUserPassword(id, userId, body) {
    return this.superadminService.resetTenantUserPassword(id, userId, body);
  }

  @Get('stats')
  getStats() {
    return this.superadminService.getStats();
  }

  @Get('settings')
  getSettings() {
    return this.superadminService.getSettings();
  }

  @Put('settings')
  @Bind(Body())
  updateSettings(body) {
    return this.superadminService.updateSettings(body);
  }
}

defineParamTypes(SuperadminController, SuperadminService);

module.exports = { SuperadminController };
