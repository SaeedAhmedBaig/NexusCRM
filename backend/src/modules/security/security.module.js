const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { RbacModule } = require('../rbac/rbac.module');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { ActivityEventSchema, ActivityEventModelName } = require('../activity/schemas/activity-event.schema');
const { DataJobSchema, DataJobModelName } = require('../data-jobs/schemas/data-job.schema');
const { SecurityService } = require('./security.service');
const { SecurityController } = require('./security.controller');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: TenantModelName, schema: TenantSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: ActivityEventModelName, schema: ActivityEventSchema },
      { name: DataJobModelName, schema: DataJobSchema },
    ]),
  ],
  controllers: [SecurityController],
  providers: [
    withModels(SecurityService, {
      tenantModel: TenantModelName,
      userTenantModel: UserTenantModelName,
      activityEventModel: ActivityEventModelName,
      dataJobModel: DataJobModelName,
    }),
  ],
  exports: [SecurityService],
})
class SecurityModule {}

module.exports = { SecurityModule };
