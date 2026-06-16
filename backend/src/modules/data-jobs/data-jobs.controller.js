const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param, UseGuards } = require('@nestjs/common');
const { DataJobsService } = require('./data-jobs.service');
const { defineParamTypes } = require('../../common/define-param-types');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canManageDataJobs } = require('../../common/policies/policy-handlers');

@Controller('data-jobs')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canManageDataJobs)
class DataJobsController {
  dataJobsService;

  constructor(dataJobsService) {
    this.dataJobsService = dataJobsService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.dataJobsService.list(req.tenantId, query);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.dataJobsService.create(req.tenantId, req.user.id, body);
  }

  @Patch(':id/status')
  @Bind(Body(), Req(), Param('id'))
  updateStatus(body, req, id) {
    return this.dataJobsService.updateStatus(req.tenantId, req.user.id, id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.dataJobsService.findOne(req.tenantId, id);
  }

  @Post(':id/preview')
  @Bind(Body(), Req(), Param('id'))
  preview(body, req, id) {
    return this.dataJobsService.preview(req.tenantId, id, body);
  }

  @Post(':id/run')
  @Bind(Req(), Param('id'))
  run(req, id) {
    return this.dataJobsService.run(req.tenantId, req.user.id, id);
  }

  @Post(':id/retry')
  @Bind(Req(), Param('id'))
  retry(req, id) {
    return this.dataJobsService.retry(req.tenantId, req.user.id, id);
  }

  @Post(':id/cancel')
  @Bind(Req(), Param('id'))
  cancel(req, id) {
    return this.dataJobsService.cancel(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(DataJobsController, DataJobsService);

module.exports = { DataJobsController };
