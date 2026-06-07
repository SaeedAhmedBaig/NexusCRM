const { Controller, Get, Patch, Bind, Req, Query, Param } = require('@nestjs/common');
const { NotificationsService } = require('./notifications.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('notifications')
class NotificationsController {
  notificationsService;

  constructor(notificationsService) {
    this.notificationsService = notificationsService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.notificationsService.list(req.tenantId, req.user.id, query);
  }

  @Get('unread-count')
  @Bind(Req())
  async unreadCount(req) {
    const count = await this.notificationsService.unreadCount(req.tenantId, req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @Bind(Req(), Param('id'))
  markRead(req, id) {
    return this.notificationsService.markRead(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(NotificationsController, NotificationsService);

module.exports = { NotificationsController };
