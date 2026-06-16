const { Controller, Get, Post, Bind, Body, Req, Headers, UseGuards } = require('@nestjs/common');
const { Public } = require('../../common/decorators/public.decorator');
const { BillingService } = require('./billing.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { Roles } = require('../../common/decorators/roles.decorator');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { ROLES } = require('../../common/constants/roles');
const { canManageSettings } = require('../../common/policies/policy-handlers');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('billing')
class BillingController {
  billingService;

  constructor(billingService) {
    this.billingService = billingService;
  }

  @Get()
  @UseGuards(RolesGuard, PoliciesGuard)
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Req())
  summary(req) {
    return this.billingService.getBillingSummary(req.tenantId, req.user.id);
  }

  @Post('portal')
  @UseGuards(RolesGuard, PoliciesGuard)
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Body(), Req())
  portal(body, req) {
    const returnUrl = body.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/billing`;
    return this.billingService.createPortalSession(req.tenantId, returnUrl, req.user.id);
  }

  @Post('checkout')
  @UseGuards(RolesGuard, PoliciesGuard)
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Body(), Req())
  checkout(body, req) {
    const returnUrl = body.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/billing`;
    return this.billingService.createCheckoutSession(req.tenantId, body.plan, returnUrl, req.user.id);
  }

  @Public()
  @Post('webhook')
  @Bind(Req(), Headers('stripe-signature'))
  webhook(req, signature) {
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})));
    return this.billingService.handleWebhook(rawBody, signature);
  }
}

defineParamTypes(BillingController, BillingService);

module.exports = { BillingController };
