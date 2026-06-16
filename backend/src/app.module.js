const { Module, MiddlewareConsumer, NestModule } = require('@nestjs/common');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { MongooseModule } = require('@nestjs/mongoose');
const { APP_GUARD, APP_INTERCEPTOR } = require('@nestjs/core');
const { TenantModule } = require('./modules/tenant/tenant.module');
const { AuthModule } = require('./modules/auth/auth.module');
const { SubscriptionModule } = require('./modules/subscription/subscription.module');
const { RbacModule } = require('./modules/rbac/rbac.module');
const { EmailModule } = require('./modules/email/email.module');
const { PublicModule } = require('./modules/public/public.module');
const { DashboardModule } = require('./modules/dashboard/dashboard.module');
const { CrmModule } = require('./modules/crm/crm.module');
const { TasksModule } = require('./modules/tasks/tasks.module');
const { MailModule } = require('./modules/mail/mail.module');
const { AnalyticsModule } = require('./modules/analytics/analytics.module');
const { RealtimeModule } = require('./modules/realtime/realtime.module');
const { VoipModule } = require('./modules/voip/voip.module');
const { ExtensionsModule } = require('./modules/extensions/extensions.module');
const { SuperadminModule } = require('./modules/superadmin/superadmin.module');
const { ActivityModule } = require('./modules/activity/activity.module');
const { MetadataModule } = require('./modules/metadata/metadata.module');
const { DataJobsModule } = require('./modules/data-jobs/data-jobs.module');
const { TenantMiddleware } = require('./common/middleware/tenant.middleware');
const { TenantGuard } = require('./common/guards/tenant.guard');
const { TenantScopeInterceptor } = require('./common/interceptors/tenant-scope.interceptor');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config) => ({
        uri: config.get('MONGODB_URI', 'mongodb://127.0.0.1:27017/crm_saas'),
      }),
      inject: [ConfigService],
    }),
    TenantModule,
    AuthModule,
    SubscriptionModule,
    RbacModule,
    EmailModule,
    PublicModule,
    DashboardModule,
    CrmModule,
    TasksModule,
    MailModule,
    AnalyticsModule,
    RealtimeModule,
    VoipModule,
    ActivityModule,
    MetadataModule,
    DataJobsModule,
    ExtensionsModule,
    SuperadminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantScopeInterceptor,
    },
  ],
})
class AppModule {
  configure(consumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

module.exports = { AppModule };
