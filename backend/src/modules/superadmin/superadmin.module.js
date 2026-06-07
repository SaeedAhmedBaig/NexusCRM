const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { ConfigService } = require('@nestjs/config');
const { withModels } = require('../../common/providers/with-models');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { MassmailCampaignSchema, MassmailCampaignModelName } = require('../mail/schemas/massmail-campaign.schema');
const { AttachmentSchema, AttachmentModelName } = require('../crm/schemas/attachment.schema');
const { DealSchema, DealModelName } = require('../crm/schemas/deal.schema');
const { ContactSchema, ContactModelName } = require('../crm/schemas/contact.schema');
const { SystemSettingsSchema, SystemSettingsModelName } = require('./schemas/system-settings.schema');
const { SuperadminService } = require('./superadmin.service');
const { SuperadminController } = require('./superadmin.controller');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantModelName, schema: TenantSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: UserModelName, schema: UserSchema },
      { name: MassmailCampaignModelName, schema: MassmailCampaignSchema },
      { name: AttachmentModelName, schema: AttachmentSchema },
      { name: DealModelName, schema: DealSchema },
      { name: ContactModelName, schema: ContactSchema },
      { name: SystemSettingsModelName, schema: SystemSettingsSchema },
    ]),
  ],
  controllers: [SuperadminController],
  providers: [
    withModels(
      SuperadminService,
      {
        tenantModel: 'Tenant',
        userTenantModel: 'UserTenant',
        userModel: 'User',
        campaignModel: 'MassmailCampaign',
        attachmentModel: 'Attachment',
        dealModel: 'Deal',
        contactModel: 'Contact',
        systemSettingsModel: 'SystemSettings',
      },
      [{ token: ConfigService }],
    ),
  ],
})
class SuperadminModule {}

module.exports = { SuperadminModule };
