const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param } = require('@nestjs/common');
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

  @Post(':id/payments')
  @Bind(Body(), Req(), Param('id'))
  addPayment(body, req, id) {
    return this.dealsService.addPayment(req.tenantId, id, req.user.id, body);
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
