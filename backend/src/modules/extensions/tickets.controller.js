const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { TicketsService } = require('./tickets.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');

const canManageTickets = (ability) => ability.can('manage', 'Ticket');

@Controller('tickets')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canManageTickets)
class TicketsController {
  service;

  constructor(service) {
    this.service = service;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.service.list(req.tenantId, query, req.user);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.service.create(req.tenantId, req.user.id, body);
  }

  @Post('bulk')
  @Bind(Body(), Req())
  bulk(body, req) {
    return this.service.bulk(req.tenantId, req.user.id, body);
  }

  @Get(':id/conversation')
  @Bind(Req(), Param('id'))
  conversation(req, id) {
    return this.service.getConversation(req.tenantId, id);
  }

  @Post(':id/replies')
  @Bind(Body(), Req(), Param('id'))
  reply(body, req, id) {
    return this.service.addReply(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/notes')
  @Bind(Body(), Req(), Param('id'))
  note(body, req, id) {
    return this.service.addNote(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/apply-macro')
  @Bind(Body(), Req(), Param('id'))
  applyMacro(body, req, id) {
    return this.service.applyMacro(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/route')
  @Bind(Body(), Req(), Param('id'))
  route(body, req, id) {
    return this.service.route(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/resolve')
  @Bind(Body(), Req(), Param('id'))
  resolve(body, req, id) {
    return this.service.resolve(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/reopen')
  @Bind(Body(), Req(), Param('id'))
  reopen(body, req, id) {
    return this.service.reopen(req.tenantId, req.user.id, id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.service.findOne(req.tenantId, id, req.user);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.service.update(req.tenantId, req.user.id, id, body);
  }

  @Delete(':id')
  @Bind(Req(), Param('id'))
  remove(req, id) {
    return this.service.remove(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(TicketsController, TicketsService);

module.exports = { TicketsController };
