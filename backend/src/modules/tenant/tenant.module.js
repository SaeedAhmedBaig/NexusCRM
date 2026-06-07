const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { TenantSchema, TenantModelName } = require('./schemas/tenant.schema');
const { TenantService } = require('./tenant.service');
const { TenantController } = require('./tenant.controller');
const { TenantDataController } = require('./tenant-data.controller');
const { OnboardingService } = require('./onboarding.service');
const { OnboardingController } = require('./onboarding.controller');
const { TenantSettingsController } = require('./tenant-settings.controller');
const { LeadSourcesController } = require('./lead-sources.controller');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { DepartmentSchema, DepartmentModelName } = require('../rbac/schemas/department.schema');
const { LeadSourceSchema, LeadSourceModelName } = require('../crm/schemas/lead-source.schema');
const { RbacModule } = require('../rbac/rbac.module');
const { withModels } = require('../../common/providers/with-models');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: TenantModelName, schema: TenantSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: DepartmentModelName, schema: DepartmentSchema },
      { name: LeadSourceModelName, schema: LeadSourceSchema },
    ]),
  ],
  controllers: [TenantController, TenantDataController, OnboardingController, TenantSettingsController, LeadSourcesController],
  providers: [
    withModels(TenantService, { tenantModel: 'Tenant' }, []),
    withModels(
      OnboardingService,
      {
        tenantModel: 'Tenant',
        departmentModel: 'Department',
        leadSourceModel: 'LeadSource',
      },
      [
        { token: require('../rbac/users.service').UsersService },
        { token: require('../rbac/rbac.service').RbacService },
      ],
    ),
    withModels(TenantDataController, { userTenantModel: 'UserTenant' }, []),
    withModels(LeadSourcesController, { leadSourceModel: 'LeadSource', tenantModel: 'Tenant' }, []),
    RolesGuard,
    PoliciesGuard,
  ],
  exports: [TenantService, OnboardingService, MongooseModule],
})
class TenantModule {}

module.exports = { TenantModule };
