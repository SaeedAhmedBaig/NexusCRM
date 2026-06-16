const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { ConfigModule } = require('@nestjs/config');
const { SubscriptionService } = require('./subscription.service');
const { BillingService } = require('./billing.service');
const { BillingController } = require('./billing.controller');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { NotificationSchema, NotificationModelName } = require('../realtime/schemas/notification.schema');
const { withModels } = require('../../common/providers/with-models');
const { ConfigService } = require('@nestjs/config');
const { RbacModule } = require('../rbac/rbac.module');

@Module({
  imports: [
    ConfigModule,
    RbacModule,
    MongooseModule.forFeature([
      { name: TenantModelName, schema: TenantSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: NotificationModelName, schema: NotificationSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [
    SubscriptionService,
    withModels(
      BillingService,
      { tenantModel: 'Tenant', userTenantModel: 'UserTenant', notificationModel: 'Notification' },
      [{ token: SubscriptionService }, { token: ConfigService }],
    ),
  ],
  exports: [SubscriptionService, BillingService],
})
class SubscriptionModule {}

module.exports = { SubscriptionModule };
