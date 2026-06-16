const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { SharedInboxService } = require('./shared-inbox.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canReadInbox, canManageInbox } = require('../../common/policies/policy-handlers');

@Controller('inbox')
@UseGuards(RolesGuard, PoliciesGuard)
class SharedInboxController {
  sharedInboxService;

  constructor(sharedInboxService) {
    this.sharedInboxService = sharedInboxService;
  }

  @Get('threads')
  @CheckPolicies(canReadInbox)
  @Bind(Req(), Query())
  listThreads(req, query) {
    return this.sharedInboxService.listThreads(req.tenantId, query);
  }

  @Get('threads/:id')
  @CheckPolicies(canReadInbox)
  @Bind(Req(), Param('id'))
  getThread(req, id) {
    return this.sharedInboxService.getThread(req.tenantId, id);
  }

  @Post('sync')
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req())
  sync(body, req) {
    return this.sharedInboxService.sync(req.tenantId, req.user.id, body);
  }

  @Post('threads/:id/reply')
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req(), Param('id'))
  reply(body, req, id) {
    return this.sharedInboxService.reply(req.tenantId, req.user.id, id, body);
  }

  @Post('threads/:id/notes')
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req(), Param('id'))
  note(body, req, id) {
    return this.sharedInboxService.note(req.tenantId, req.user.id, id, body);
  }

  @Patch('threads/:id/assign')
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req(), Param('id'))
  assign(body, req, id) {
    return this.sharedInboxService.assign(req.tenantId, req.user.id, id, body);
  }

  @Patch('threads/:id/read')
  @CheckPolicies(canReadInbox)
  @Bind(Body(), Req(), Param('id'))
  markRead(body, req, id) {
    return this.sharedInboxService.markRead(req.tenantId, id, body.read !== false);
  }

  @Patch('threads/:id/archive')
  @CheckPolicies(canManageInbox)
  @Bind(Req(), Param('id'))
  archive(req, id) {
    return this.sharedInboxService.archive(req.tenantId, req.user.id, id);
  }

  @Patch('threads/:id/link')
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req(), Param('id'))
  linkEntity(body, req, id) {
    return this.sharedInboxService.linkEntity(req.tenantId, req.user.id, id, body);
  }
}

defineParamTypes(SharedInboxController, SharedInboxService);

module.exports = { SharedInboxController };
