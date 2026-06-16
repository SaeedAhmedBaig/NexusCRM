const { Controller, Get, Post, Bind, Body, Req, Param, Query, UseGuards } = require('@nestjs/common');
const { Public } = require('../../common/decorators/public.decorator');
const { EmailAccountsService } = require('./email-accounts.service');
const { EmailsService } = require('./emails.service');
const { MassmailService } = require('./massmail.service');
const { SharedInboxService } = require('./shared-inbox.service');
const { defineParamTypes } = require('../../common/define-param-types');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canManageMail, canManageInbox } = require('../../common/policies/policy-handlers');

@Controller()
class MailController {
  emailAccountsService;
  emailsService;
  massmailService;
  sharedInboxService;

  constructor(emailAccountsService, emailsService, massmailService, sharedInboxService) {
    this.emailAccountsService = emailAccountsService;
    this.emailsService = emailsService;
    this.massmailService = massmailService;
    this.sharedInboxService = sharedInboxService;
  }

  @Get('email-accounts')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req())
  listAccounts(req) {
    return this.emailAccountsService.list(req.tenantId);
  }

  @Post('email-accounts')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Body(), Req())
  createAccount(body, req) {
    return this.emailAccountsService.create(req.tenantId, req.user.id, body);
  }

  @Post('email-accounts/:id/test')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req(), Param('id'))
  testAccount(req, id) {
    return this.emailAccountsService.testConnection(req.tenantId, id);
  }

  @Post('email-accounts/sync')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageInbox)
  @Bind(Body(), Req())
  syncImap(body, req) {
    return this.sharedInboxService.sync(req.tenantId, req.user.id, body);
  }

  @Post('emails/send')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Body(), Req())
  sendEmail(body, req) {
    return this.emailsService.send(req.tenantId, req.user.id, body);
  }

  @Get('massmail/campaigns')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req())
  listCampaigns(req) {
    return this.massmailService.listCampaigns(req.tenantId);
  }

  @Get('massmail/campaigns/:id')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req(), Param('id'))
  getCampaign(req, id) {
    return this.massmailService.getCampaign(req.tenantId, id);
  }

  @Post('massmail/campaigns')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Body(), Req())
  createCampaign(body, req) {
    return this.massmailService.createCampaign(req.tenantId, req.user.id, body);
  }

  @Post('massmail/campaigns/:id/send')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req(), Param('id'))
  sendCampaign(req, id) {
    return this.massmailService.sendCampaign(req.tenantId, id);
  }

  @Post('massmail/preview-recipients')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Body(), Req())
  previewRecipients(body, req) {
    return this.massmailService.previewRecipients(req.tenantId, body);
  }

  @Get('massmail/templates')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req())
  listTemplates(req) {
    return this.massmailService.listTemplates(req.tenantId);
  }

  @Get('massmail/unsubscribes')
  @UseGuards(RolesGuard, PoliciesGuard)
  @CheckPolicies(canManageMail)
  @Bind(Req())
  listUnsubscribes(req) {
    return this.massmailService.listUnsubscribes(req.tenantId);
  }

  @Public()
  @Post('unsubscribe')
  @Bind(Body(), Query())
  unsubscribe(body, query) {
    return this.massmailService.unsubscribeEmail(
      body.tenantId || query.tenant,
      body.email || query.email,
    );
  }
}

defineParamTypes(MailController, EmailAccountsService, EmailsService, MassmailService, SharedInboxService);

module.exports = { MailController };
