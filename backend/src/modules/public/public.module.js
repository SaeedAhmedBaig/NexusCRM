const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { PublicController } = require('./public.controller');
const { PublicService } = require('./public.service');
const { SubscriptionModule } = require('../subscription/subscription.module');
const { EmailModule } = require('../email/email.module');
const { LeadSourceSchema, LeadSourceModelName } = require('../crm/schemas/lead-source.schema');
const { RequestSchema, RequestModelName } = require('../crm/schemas/request.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { withModels } = require('../../common/providers/with-models');
const { ConfigService } = require('@nestjs/config');
const { EmailService } = require('../email/email.service');

@Module({
  imports: [
    SubscriptionModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: LeadSourceModelName, schema: LeadSourceSchema },
      { name: RequestModelName, schema: RequestSchema },
      { name: TenantModelName, schema: TenantSchema },
    ]),
  ],
  controllers: [PublicController],
  providers: [
    withModels(
      PublicService,
      {
        leadSourceModel: 'LeadSource',
        requestModel: 'Request',
        tenantModel: 'Tenant',
      },
      [{ token: ConfigService }, { token: EmailService }],
    ),
  ],
  exports: [PublicService],
})
class PublicModule {}

module.exports = { PublicModule };
