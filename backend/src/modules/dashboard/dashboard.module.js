const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { DealSchema, DealModelName } = require('../crm/schemas/deal.schema');
const { TaskSchema, TaskModelName } = require('../crm/schemas/task.schema');
const { RequestSchema, RequestModelName } = require('../crm/schemas/request.schema');
const { AuditLogSchema, AuditLogModelName } = require('../crm/schemas/audit-log.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { ContactSchema, ContactModelName } = require('../crm/schemas/contact.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { TicketSchema, TicketModelName } = require('../extensions/schemas/ticket.schema');
const { LiveChatSessionSchema, LiveChatSessionModelName } = require('../extensions/schemas/live-chat-session.schema');
const { DashboardService } = require('./dashboard.service');
const { DashboardController } = require('./dashboard.controller');
const { withModels } = require('../../common/providers/with-models');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealModelName, schema: DealSchema },
      { name: TaskModelName, schema: TaskSchema },
      { name: RequestModelName, schema: RequestSchema },
      { name: AuditLogModelName, schema: AuditLogSchema },
      { name: UserModelName, schema: UserSchema },
      { name: TenantModelName, schema: TenantSchema },
      { name: ContactModelName, schema: ContactSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
      { name: TicketModelName, schema: TicketSchema },
      { name: LiveChatSessionModelName, schema: LiveChatSessionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    withModels(
      DashboardService,
      {
        dealModel: 'Deal',
        taskModel: 'Task',
        requestModel: 'Request',
        auditLogModel: 'AuditLog',
        userModel: 'User',
        tenantModel: 'Tenant',
        contactModel: 'Contact',
        userTenantModel: 'UserTenant',
        ticketModel: 'Ticket',
        liveChatSessionModel: 'LiveChatSession',
      },
      [],
    ),
  ],
  exports: [DashboardService],
})
class DashboardModule {}

module.exports = { DashboardModule };
