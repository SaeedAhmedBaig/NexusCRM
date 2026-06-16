const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param, Res, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');

const ROUTE_SUBJECTS = {
  products: 'Product',
  sms: 'Mail',
  knowledge: 'Ticket',
  automation: 'AutomationRule',
  'automation-runs': 'AutomationRule',
  'report-export-jobs': 'DataJob',
  'live-chat': 'Inbox',
  'ticket-queues': 'Ticket',
  'ticket-macros': 'Ticket',
};

function canReadSubject(subject) {
  return (ability) => ability.can('read', subject) || ability.can('manage', subject);
}

function canManageSubject(subject) {
  return (ability) => ability.can('manage', subject);
}

function createEntityController(route, ServiceClass) {
  const subject = ROUTE_SUBJECTS[route] || 'Settings';

  @Controller(route)
  @UseGuards(RolesGuard, PoliciesGuard)
  class GeneratedController {
    service;

    constructor(service) {
      this.service = service;
    }

    @Get()
    @CheckPolicies(canReadSubject(subject))
    @Bind(Req(), Query())
    list(req, query) {
      return this.service.list(req.tenantId, query, req.user);
    }

    @Post()
    @CheckPolicies(canManageSubject(subject))
    @Bind(Body(), Req())
    create(body, req) {
      return this.service.create(req.tenantId, req.user.id, body);
    }

    @Get(':id/download')
    @CheckPolicies(canReadSubject(subject))
    @Bind(Req(), Param('id'), Res())
    async download(req, id, res) {
      const file = await this.service.download(req.tenantId, id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    }

    @Get(':id')
    @CheckPolicies(canReadSubject(subject))
    @Bind(Req(), Param('id'))
    getOne(req, id) {
      return this.service.findOne(req.tenantId, id, req.user);
    }

    @Patch(':id')
    @CheckPolicies(canManageSubject(subject))
    @Bind(Body(), Req(), Param('id'))
    update(body, req, id) {
      return this.service.update(req.tenantId, req.user.id, id, body);
    }

    @Delete(':id')
    @CheckPolicies(canManageSubject(subject))
    @Bind(Req(), Param('id'))
    remove(req, id) {
      return this.service.remove(req.tenantId, req.user.id, id);
    }

    @Post(':id/run')
    @CheckPolicies(canManageSubject(subject))
    @Bind(Req(), Param('id'), Body())
    run(req, id, body) {
      return this.service.run(req.tenantId, req.user.id, id, body);
    }

    @Post('bulk')
    @CheckPolicies(canManageSubject(subject))
    @Bind(Body(), Req())
    bulk(body, req) {
      return this.service.bulk(req.tenantId, req.user.id, body);
    }
  }

  defineParamTypes(GeneratedController, ServiceClass);
  return GeneratedController;
}

module.exports = { createEntityController };
