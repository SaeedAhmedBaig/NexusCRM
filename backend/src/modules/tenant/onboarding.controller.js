const { Controller, Post, Get, Bind, Body, Req } = require('@nestjs/common');
const { OnboardingService } = require('./onboarding.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('tenants/onboarding')
class OnboardingController {
  onboardingService;

  constructor(onboardingService) {
    this.onboardingService = onboardingService;
  }

  @Get('status')
  @Bind(Req())
  status(req) {
    return this.onboardingService.getOnboardingStatus(req.tenantId);
  }

  @Post('complete')
  @Bind(Body(), Req())
  complete(body, req) {
    return this.onboardingService.completeOnboarding(req.tenantId, req.user.id, body);
  }
}

defineParamTypes(OnboardingController, OnboardingService);

module.exports = { OnboardingController };
