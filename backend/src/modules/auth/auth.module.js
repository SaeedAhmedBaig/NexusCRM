const { Module } = require('@nestjs/common');
const { JwtModule, JwtService } = require('@nestjs/jwt');
const { PassportModule } = require('@nestjs/passport');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { MongooseModule, getModelToken } = require('@nestjs/mongoose');
const { UserSchema, UserModelName } = require('./schemas/user.schema');
const { UserTenantSchema, UserTenantModelName } = require('./schemas/user-tenant.schema');
const { ActivityEventSchema, ActivityEventModelName } = require('../activity/schemas/activity-event.schema');
const { NotificationSchema, NotificationModelName } = require('../realtime/schemas/notification.schema');
const { AuthService } = require('./auth.service');
const { SuperadminBootstrapService } = require('./superadmin-bootstrap.service');
const { AuthController } = require('./auth.controller');
const { UsersController } = require('./users.controller');
const { JwtStrategy } = require('./strategies/jwt.strategy');
const { TenantModule } = require('../tenant/tenant.module');
const { RbacModule } = require('../rbac/rbac.module');
const { EmailModule } = require('../email/email.module');
const { withModels } = require('../../common/providers/with-models');

@Module({
  imports: [
    TenantModule,
    RbacModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: ActivityEventModelName, schema: ActivityEventSchema },
      { name: NotificationModelName, schema: NotificationSchema },
    ]),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    withModels(
      AuthService,
      { userModel: 'User', userTenantModel: 'UserTenant', activityEventModel: 'ActivityEvent', notificationModel: 'Notification' },
      [
        { token: require('../tenant/tenant.service').TenantService },
        { token: require('../rbac/rbac.service').RbacService },
        { token: require('../rbac/users.service').UsersService },
        { token: require('../email/email.service').EmailService },
        { token: require('../tenant/onboarding.service').OnboardingService },
        { token: JwtService },
        { token: ConfigService },
      ],
    ),
    withModels(
      SuperadminBootstrapService,
      { userModel: 'User', userTenantModel: 'UserTenant', tenantModel: 'Tenant' },
      [
        { token: require('../tenant/onboarding.service').OnboardingService },
        { token: require('../rbac/rbac.service').RbacService },
        { token: ConfigService },
      ],
    ),
    {
      provide: JwtStrategy,
      useFactory: (userModel, configService) => {
        const strategy = new JwtStrategy(configService);
        strategy.userModel = userModel;
        return strategy;
      },
      inject: [getModelToken('User'), ConfigService],
    },
  ],
  exports: [AuthService, JwtModule],
})
class AuthModule {}

module.exports = { AuthModule };
