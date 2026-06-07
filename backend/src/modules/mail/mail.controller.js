const { Controller, Get, Post, Bind, Body, Req, Param, Query } = require('@nestjs/common');
const { Public } = require('../../common/decorators/public.decorator');
const { EmailAccountsService } = require('./email-accounts.service');
const { EmailsService } = require('./emails.service');
const { MassmailService } = require('./massmail.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller()
class MailController {
  emailAccountsService;
  emailsService;
  massmailService;

  constructor(emailAccountsService, emailsService, massmailService) {
    this.emailAccountsService = emailAccountsService;
    this.emailsService = emailsService;
    this.massmailService = massmailService;
  }

  @Get('email-accounts')
  @Bind(Req())
  listAccounts(req) {
    return this.emailAccountsService.list(req.tenantId);
  }

  @Post('email-accounts')
  @Bind(Body(), Req())
  createAccount(body, req) {
    return this.emailAccountsService.create(req.tenantId, req.user.id, body);
  }

  @Post('email-accounts/:id/test')
  @Bind(Req(), Param('id'))
  testAccount(req, id) {
    return this.emailAccountsService.testConnection(req.tenantId, id);
  }

  @Post('email-accounts/sync')
  @Bind(Req())
  syncImap(req) {
    return this.emailAccountsService.syncImap(req.tenantId, req.user.id);
  }

  @Post('emails/send')
  @Bind(Body(), Req())
  sendEmail(body, req) {
    return this.emailsService.send(req.tenantId, req.user.id, body);
  }

  @Get('massmail/campaigns')
  @Bind(Req())
  listCampaigns(req) {
    return this.massmailService.listCampaigns(req.tenantId);
  }

  @Get('massmail/campaigns/:id')
  @Bind(Req(), Param('id'))
  getCampaign(req, id) {
    return this.massmailService.getCampaign(req.tenantId, id);
  }

  @Post('massmail/campaigns')
  @Bind(Body(), Req())
  createCampaign(body, req) {
    return this.massmailService.createCampaign(req.tenantId, req.user.id, body);
  }

  @Post('massmail/campaigns/:id/send')
  @Bind(Req(), Param('id'))
  sendCampaign(req, id) {
    return this.massmailService.sendCampaign(req.tenantId, id);
  }

  @Post('massmail/preview-recipients')
  @Bind(Body(), Req())
  previewRecipients(body, req) {
    return this.massmailService.previewRecipients(req.tenantId, body);
  }

  @Get('massmail/templates')
  @Bind(Req())
  listTemplates(req) {
    return this.massmailService.listTemplates(req.tenantId);
  }

  @Get('massmail/unsubscribes')
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

defineParamTypes(MailController, EmailAccountsService, EmailsService, MassmailService);

module.exports = { MailController };
