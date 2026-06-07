const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { ChatMessageSchema, ChatMessageModelName } = require('./schemas/chat-message.schema');
const { NotificationSchema, NotificationModelName } = require('./schemas/notification.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { UserTenantSchema, UserTenantModelName } = require('../auth/schemas/user-tenant.schema');
const { ChatService } = require('./chat.service');
const { NotificationsService } = require('./notifications.service');
const { ChatController } = require('./chat.controller');
const { NotificationsController } = require('./notifications.controller');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessageModelName, schema: ChatMessageSchema },
      { name: NotificationModelName, schema: NotificationSchema },
      { name: UserModelName, schema: UserSchema },
      { name: UserTenantModelName, schema: UserTenantSchema },
    ]),
  ],
  controllers: [ChatController, NotificationsController],
  providers: [
    withModels(ChatService, {
      chatMessageModel: 'ChatMessage',
      userModel: 'User',
    }),
    withModels(NotificationsService, {
      notificationModel: 'Notification',
      userTenantModel: 'UserTenant',
    }),
    {
      provide: 'REALTIME_WIRING',
      useFactory: (chatService, notificationsService) => {
        chatService.notificationsService = notificationsService;
        return true;
      },
      inject: [ChatService, NotificationsService],
    },
  ],
  exports: [ChatService, NotificationsService],
})
class RealtimeModule {}

module.exports = { RealtimeModule };
