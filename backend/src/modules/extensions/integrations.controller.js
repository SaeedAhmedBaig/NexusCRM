const { Controller, Get, Bind, Req } = require('@nestjs/common');
const { IntegrationsService } = require('./integrations.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('integrations')
class IntegrationsController {
  integrationsService;

  constructor(integrationsService) {
    this.integrationsService = integrationsService;
  }

  @Get()
  @Bind(Req())
  list(req) {
    return this.integrationsService.list(req.tenantId);
  }
}

defineParamTypes(IntegrationsController, IntegrationsService);

module.exports = { IntegrationsController };
