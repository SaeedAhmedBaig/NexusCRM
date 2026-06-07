const { Controller, Get, Post, Bind, Body, Req, Query, Param, Res } = require('@nestjs/common');
const { ChatService } = require('./chat.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('chat')
class ChatController {
  chatService;

  constructor(chatService) {
    this.chatService = chatService;
  }

  @Get('messages')
  @Bind(Req(), Query())
  list(req, query) {
    return this.chatService.listMessages(req.tenantId, query);
  }

  @Post('messages')
  @Bind(Body(), Req())
  create(body, req) {
    return this.chatService.createMessage(req.tenantId, req.user.id, body);
  }

  @Get('attachments/:id/download')
  @Bind(Req(), Param('id'), Res())
  async download(req, id, res) {
    const fs = require('fs');
    const file = await this.chatService.getAttachment(req.tenantId, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(fs.readFileSync(file.path));
  }
}

defineParamTypes(ChatController, ChatService);

module.exports = { ChatController };
