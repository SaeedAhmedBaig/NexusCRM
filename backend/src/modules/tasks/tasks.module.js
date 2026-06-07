const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { TaskSchema, TaskModelName } = require('../crm/schemas/task.schema');
const { ProjectSchema, ProjectModelName } = require('./schemas/project.schema');
const { MemoSchema, MemoModelName } = require('./schemas/memo.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { NotificationSchema, NotificationModelName } = require('../realtime/schemas/notification.schema');
const { TasksService } = require('./tasks.service');
const { ProjectsService } = require('./projects.service');
const { MemosService } = require('./memos.service');
const { TasksController } = require('./tasks.controller');
const { ProjectsController } = require('./projects.controller');
const { MemosController } = require('./memos.controller');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskModelName, schema: TaskSchema },
      { name: ProjectModelName, schema: ProjectSchema },
      { name: MemoModelName, schema: MemoSchema },
      { name: TenantModelName, schema: TenantSchema },
      { name: UserModelName, schema: UserSchema },
      { name: NotificationModelName, schema: NotificationSchema },
    ]),
  ],
  controllers: [TasksController, ProjectsController, MemosController],
  providers: [
    withModels(TasksService, {
      taskModel: 'Task',
      projectModel: 'Project',
      userModel: 'User',
      tenantModel: 'Tenant',
      notificationModel: 'Notification',
    }),
    withModels(ProjectsService, { projectModel: 'Project', taskModel: 'Task' }),
    withModels(MemosService, {
      memoModel: 'Memo',
      taskModel: 'Task',
      projectModel: 'Project',
      userModel: 'User',
      tenantModel: 'Tenant',
    }),
  ],
})
class TasksModule {}

module.exports = { TasksModule };
