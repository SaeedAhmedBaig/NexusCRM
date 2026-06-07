const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { DealSchema, DealModelName } = require('../crm/schemas/deal.schema');
const { LeadSchema, LeadModelName } = require('../crm/schemas/lead.schema');
const { RequestSchema, RequestModelName } = require('../crm/schemas/request.schema');
const { TaskSchema, TaskModelName } = require('../crm/schemas/task.schema');
const { AnalyticsService } = require('./analytics.service');
const { AnalyticsController } = require('./analytics.controller');
const { RbacModule } = require('../rbac/rbac.module');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: DealModelName, schema: DealSchema },
      { name: LeadModelName, schema: LeadSchema },
      { name: RequestModelName, schema: RequestSchema },
      { name: TaskModelName, schema: TaskSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    withModels(AnalyticsService, {
      dealModel: 'Deal',
      leadModel: 'Lead',
      requestModel: 'Request',
      taskModel: 'Task',
    }),
    RolesGuard,
    PoliciesGuard,
  ],
})
class AnalyticsModule {}

module.exports = { AnalyticsModule };
