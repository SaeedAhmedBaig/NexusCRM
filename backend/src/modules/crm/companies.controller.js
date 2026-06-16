const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { CompaniesService } = require('./companies.service');

@Controller('companies')
class CompaniesController {
  companiesService;

  constructor(companiesService) {
    this.companiesService = companiesService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.companiesService.list(req.tenantId, query, req.user);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.companiesService.create(req.tenantId, req.user.id, body);
  }

  @Post('bulk')
  @Bind(Body(), Req())
  bulk(body, req) {
    return this.companiesService.bulk(req.tenantId, req.user.id, body);
  }

  @Get(':id/360')
  @Bind(Req(), Param('id'))
  getAccount360(req, id) {
    return this.companiesService.getAccount360(req.tenantId, id);
  }

  @Patch(':id/account-plan')
  @Bind(Body(), Req(), Param('id'))
  updateAccountPlan(body, req, id) {
    return this.companiesService.updateAccountPlan(req.tenantId, req.user.id, id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.companiesService.findOne(req.tenantId, id, req.user);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.companiesService.update(req.tenantId, req.user.id, id, body);
  }

  @Delete(':id')
  @Bind(Req(), Param('id'))
  remove(req, id) {
    return this.companiesService.remove(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(CompaniesController, CompaniesService);

module.exports = { CompaniesController };
