const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { DealsService } = require('./deals.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('deals')
class DealsController {
  dealsService;

  constructor(dealsService) {
    this.dealsService = dealsService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.dealsService.list(req.tenantId, query, req.user);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.dealsService.create(req.tenantId, req.user.id, body);
  }

  @Post('bulk')
  @Bind(Body(), Req())
  bulk(body, req) {
    return this.dealsService.bulk(req.tenantId, req.user.id, body);
  }

  @Get('pipelines')
  @Bind(Req())
  pipelines(req) {
    return this.dealsService.listPipelines(req.tenantId);
  }

  @Post('pipelines')
  @Bind(Body(), Req())
  createPipeline(body, req) {
    return this.dealsService.createPipeline(req.tenantId, body);
  }

  @Patch('pipelines/:pipelineId')
  @Bind(Body(), Req(), Param('pipelineId'))
  updatePipeline(body, req, pipelineId) {
    return this.dealsService.updatePipeline(req.tenantId, pipelineId, body);
  }

  @Get(':id/emails')
  @Bind(Req(), Param('id'))
  emails(req, id) {
    return this.dealsService.getEmails(req.tenantId, id);
  }

  @Get(':id/payments')
  @Bind(Req(), Param('id'))
  payments(req, id) {
    return this.dealsService.getPayments(req.tenantId, id);
  }

  @Get(':id/attachments')
  @Bind(Req(), Param('id'))
  attachments(req, id) {
    return this.dealsService.getAttachments(req.tenantId, id);
  }

  @Get(':id/history')
  @Bind(Req(), Param('id'))
  history(req, id) {
    return this.dealsService.getHistory(req.tenantId, id);
  }

  @Get(':id/line-items')
  @Bind(Req(), Param('id'))
  lineItems(req, id) {
    return this.dealsService.getLineItems(req.tenantId, id);
  }

  @Post(':id/payments')
  @Bind(Body(), Req(), Param('id'))
  addPayment(body, req, id) {
    return this.dealsService.addPayment(req.tenantId, id, req.user.id, body);
  }

  @Post(':id/line-items')
  @Bind(Body(), Req(), Param('id'))
  addLineItem(body, req, id) {
    return this.dealsService.addLineItem(req.tenantId, id, req.user.id, body);
  }

  @Patch(':id/line-items/:lineItemId')
  @Bind(Body(), Req(), Param('id'), Param('lineItemId'))
  updateLineItem(body, req, id, lineItemId) {
    return this.dealsService.updateLineItem(req.tenantId, id, lineItemId, req.user.id, body);
  }

  @Delete(':id/line-items/:lineItemId')
  @Bind(Req(), Param('id'), Param('lineItemId'))
  removeLineItem(req, id, lineItemId) {
    return this.dealsService.removeLineItem(req.tenantId, id, lineItemId, req.user.id);
  }

  @Post(':id/emails')
  @Bind(Body(), Req(), Param('id'))
  sendEmail(body, req, id) {
    return this.dealsService.sendEmail(req.tenantId, id, req.user.id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.dealsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.dealsService.update(req.tenantId, id, req.user.id, body);
  }
}

defineParamTypes(DealsController, DealsService);

module.exports = { DealsController };
