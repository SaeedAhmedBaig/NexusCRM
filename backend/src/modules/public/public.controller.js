const { Controller, Get, Post, Bind, Body, Req, Param } = require('@nestjs/common');
const { Public } = require('../../common/decorators/public.decorator');
const { SubscriptionService } = require('../subscription/subscription.service');
const { PublicService } = require('./public.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('public')
class PublicController {
  subscriptionService;
  publicService;

  constructor(subscriptionService, publicService) {
    this.subscriptionService = subscriptionService;
    this.publicService = publicService;
  }

  @Public()
  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPublicPlans();
  }

  @Public()
  @Get('form/:token')
  @Bind(Param('token'))
  getForm(token) {
    return this.publicService.getFormByToken(token);
  }

  @Public()
  @Post('contact')
  @Bind(Body())
  submitContact(body) {
    return this.publicService.submitContact(body);
  }

  @Public()
  @Post('add-request')
  @Bind(Body(), Req())
  addRequest(body, req) {
    const token = body.token || body.embedToken;
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;
    return this.publicService.addRequest(token, body, ip);
  }
}

defineParamTypes(PublicController, SubscriptionService, PublicService);

module.exports = { PublicController };
