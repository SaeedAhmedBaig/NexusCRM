const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { DataJobsService } = require('./data-jobs.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('data-jobs')
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
}

defineParamTypes(DataJobsController, DataJobsService);

module.exports = { DataJobsController };
