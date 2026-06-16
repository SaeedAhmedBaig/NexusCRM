const { Controller, Get, Bind, Req, Query, Param } = require('@nestjs/common');
const { ActivityService } = require('./activity.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('activity')
class ActivityController {
  activityService;

  constructor(activityService) {
    this.activityService = activityService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.activityService.list(req.tenantId, query);
  }

  @Get(':entityType/:entityId')
  @Bind(Req(), Param('entityType'), Param('entityId'), Query())
  listForEntity(req, entityType, entityId, query) {
    return this.activityService.listForEntity(req.tenantId, entityType, entityId, query);
  }
}

defineParamTypes(ActivityController, ActivityService);

module.exports = { ActivityController };
