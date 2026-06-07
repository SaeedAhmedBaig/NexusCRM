const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { EmailAccountSchema, EmailAccountModelName } = require('./schemas/email-account.schema');
const { EmailTemplateSchema, EmailTemplateModelName } = require('./schemas/email-template.schema');
const { MassmailCampaignSchema, MassmailCampaignModelName } = require('./schemas/massmail-campaign.schema');
const { UnsubscribeSchema, UnsubscribeModelName } = require('./schemas/unsubscribe.schema');
const { CrmEmailSchema, CrmEmailModelName } = require('../crm/schemas/crm-email.schema');
const { DealSchema, DealModelName } = require('../crm/schemas/deal.schema');
const { ContactSchema, ContactModelName } = require('../crm/schemas/contact.schema');
const { CompanySchema, CompanyModelName } = require('../crm/schemas/company.schema');
const { LeadSchema, LeadModelName } = require('../crm/schemas/lead.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { NotificationSchema, NotificationModelName } = require('../realtime/schemas/notification.schema');
const { EmailAccountsService } = require('./email-accounts.service');
const { EmailsService } = require('./emails.service');
const { MassmailService } = require('./massmail.service');
const { MailController } = require('./mail.controller');
const { GoogleOAuthController } = require('./google-oauth.controller');

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: EmailAccountModelName, schema: EmailAccountSchema },
      { name: EmailTemplateModelName, schema: EmailTemplateSchema },
      { name: MassmailCampaignModelName, schema: MassmailCampaignSchema },
      { name: UnsubscribeModelName, schema: UnsubscribeSchema },
      { name: CrmEmailModelName, schema: CrmEmailSchema },
      { name: DealModelName, schema: DealSchema },
      { name: ContactModelName, schema: ContactSchema },
      { name: CompanyModelName, schema: CompanySchema },
      { name: LeadModelName, schema: LeadSchema },
      { name: TenantModelName, schema: TenantSchema },
      { name: NotificationModelName, schema: NotificationSchema },
    ]),
  ],
  controllers: [MailController, GoogleOAuthController],
  providers: [
    withModels(EmailAccountsService, {
      emailAccountModel: 'EmailAccount',
      crmEmailModel: 'CrmEmail',
      dealModel: 'Deal',
      contactModel: 'Contact',
      tenantModel: 'Tenant',
    }),
    withModels(EmailsService, {
      emailAccountModel: 'EmailAccount',
      crmEmailModel: 'CrmEmail',
      dealModel: 'Deal',
      unsubscribeModel: 'Unsubscribe',
      notificationModel: 'Notification',
    }),
    withModels(MassmailService, {
      campaignModel: 'MassmailCampaign',
      templateModel: 'EmailTemplate',
      emailAccountModel: 'EmailAccount',
      contactModel: 'Contact',
      companyModel: 'Company',
      leadModel: 'Lead',
      unsubscribeModel: 'Unsubscribe',
      tenantModel: 'Tenant',
    }),
    {
      provide: 'MAIL_SERVICE_WIRING',
      useFactory: (emailAccountsService, emailsService, massmailService) => {
        emailsService.emailAccountsService = emailAccountsService;
        massmailService.emailAccountsService = emailAccountsService;
        return true;
      },
      inject: [EmailAccountsService, EmailsService, MassmailService],
    },
  ],
  exports: [EmailAccountsService, EmailsService, MassmailService],
})
class MailModule {}

module.exports = { MailModule };
