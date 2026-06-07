const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { GroupSchema, GroupModelName } = require('./schemas/group.schema');
const { DepartmentSchema, DepartmentModelName } = require('./schemas/department.schema');
const { InvitationSchema, InvitationModelName } = require('./schemas/invitation.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { RbacService } = require('./rbac.service');
const { UsersService } = require('./users.service');
const { RbacController } = require('./rbac.controller');
const { CaslAbilityFactory } = require('../../common/casl/casl-ability.factory');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { EmailModule } = require('../email/email.module');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { withModels } = require('../../common/providers/with-models');
const { ConfigService } = require('@nestjs/config');
@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      { name: GroupModelName, schema: GroupSchema },
      { name: DepartmentModelName, schema: DepartmentSchema },
      { name: InvitationModelName, schema: InvitationSchema },
      { name: UserModelName, schema: UserSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: TenantModelName, schema: TenantSchema },
    ]),
  ],
  controllers: [RbacController],
  providers: [
    withModels(
      RbacService,
      {
        groupModel: 'Group',
        departmentModel: 'Department',
        userTenantModel: 'UserTenant',
      },
      [{ token: CaslAbilityFactory }],
    ),
    withModels(
      UsersService,
      {
        userModel: 'User',
        userTenantModel: 'UserTenant',
        invitationModel: 'Invitation',
        departmentModel: 'Department',
        tenantModel: 'Tenant',
      },
      [
        { token: require('../email/email.service').EmailService },
        { token: RbacService },
        { token: ConfigService },
      ],
    ),
    CaslAbilityFactory,
    RolesGuard,
    PoliciesGuard,
  ],
  exports: [RbacService, UsersService, CaslAbilityFactory, RolesGuard, PoliciesGuard, MongooseModule],
})
class RbacModule {}

module.exports = { RbacModule };
