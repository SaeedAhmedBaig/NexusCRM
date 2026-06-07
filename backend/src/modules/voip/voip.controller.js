const { Controller, Post, Bind, Body, Req } = require('@nestjs/common');
const { VoipService } = require('./voip.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('voip')
class VoipController {
  voipService;

  constructor(voipService) {
    this.voipService = voipService;
  }

  @Post('call')
  @Bind(Body(), Req())
  call(body, req) {
    return this.voipService.initiateCall(req.tenantId, req.user.id, body);
  }
}

defineParamTypes(VoipController, VoipService);

module.exports = { VoipController };
