const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { LeadsService } = require('./leads.service');

@Controller('leads')
class LeadsController {
  leadsService;

  constructor(leadsService) {
    this.leadsService = leadsService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.leadsService.list(req.tenantId, query, req.user);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.leadsService.create(req.tenantId, req.user.id, body);
  }

  @Post('bulk')
  @Bind(Body(), Req())
  bulk(body, req) {
    return this.leadsService.bulk(req.tenantId, req.user.id, body);
  }

  @Get('routing-rules')
  @Bind(Req())
  listRoutingRules(req) {
    return this.leadsService.listRoutingRules(req.tenantId);
  }

  @Post('routing-rules')
  @Bind(Body(), Req())
  createRoutingRule(body, req) {
    return this.leadsService.createRoutingRule(req.tenantId, body);
  }

  @Patch('routing-rules/:ruleId')
  @Bind(Body(), Req(), Param('ruleId'))
  updateRoutingRule(body, req, ruleId) {
    return this.leadsService.updateRoutingRule(req.tenantId, ruleId, body);
  }

  @Delete('routing-rules/:ruleId')
  @Bind(Req(), Param('ruleId'))
  removeRoutingRule(req, ruleId) {
    return this.leadsService.removeRoutingRule(req.tenantId, ruleId);
  }

  @Get(':id/duplicates')
  @Bind(Req(), Param('id'))
  getDuplicates(req, id) {
    return this.leadsService.findDuplicates(req.tenantId, id);
  }

  @Post(':id/convert')
  @Bind(Body(), Req(), Param('id'))
  convert(body, req, id) {
    return this.leadsService.convert(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/route')
  @Bind(Body(), Req(), Param('id'))
  route(body, req, id) {
    return this.leadsService.route(req.tenantId, req.user.id, id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.leadsService.findOne(req.tenantId, id, req.user);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.leadsService.update(req.tenantId, req.user.id, id, body);
  }

  @Delete(':id')
  @Bind(Req(), Param('id'))
  remove(req, id) {
    return this.leadsService.remove(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(LeadsController, LeadsService);

module.exports = { LeadsController };
