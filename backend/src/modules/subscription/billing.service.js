const {
  Injectable,
  BadRequestException,
  NotFoundException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { SubscriptionService } = require('./subscription.service');
const { PLANS } = require('../../common/constants/plans');
const { defineParamTypes } = require('../../common/define-param-types');

const PLAN_PRICE_MAP = {
  [PLANS.PROFESSIONAL]: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
  [PLANS.BUSINESS]: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
  [PLANS.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
};

@Injectable()
class BillingService {
  tenantModel;
  userTenantModel;
  subscriptionService;
  configService;

  constructor(subscriptionService, configService) {
    this.subscriptionService = subscriptionService;
    this.configService = configService;
  }

  getStripe() {
    const key = this.configService.get('STRIPE_SECRET_KEY');
    if (!key) return null;
    // eslint-disable-next-line global-require
    const Stripe = require('stripe');
    return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
  }

  async getBillingSummary(tenantId) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const limits = this.subscriptionService.getPlanLimits(tenant.plan);
    const activeUsers = await this.userTenantModel.countDocuments({
      tenantId,
      isActive: true,
    });

    return {
      plan: tenant.plan,
      status: tenant.status,
      limits,
      usage: {
        users: activeUsers,
        storageMb: tenant.settings?.usage?.storageMb || 0,
        deals: tenant.settings?.usage?.deals || 0,
      },
      stripeCustomerId: tenant.stripeCustomerId || null,
      billingPeriodEnd: tenant.billingPeriodEnd || null,
      invoices: tenant.settings?.billing?.invoices || [],
    };
  }

  async createPortalSession(tenantId, returnUrl) {
    const stripe = this.getStripe();
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!stripe) {
      const mockUrl = `${returnUrl}?billing=mock`;
      return { url: mockUrl, mock: true };
    }

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: { tenantId: tenantId.toString() },
      });
      customerId = customer.id;
      tenant.stripeCustomerId = customerId;
      await tenant.save();
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async createCheckoutSession(tenantId, plan, returnUrl) {
    const stripe = this.getStripe();
    if (!stripe) {
      return { url: `${returnUrl}?checkout=mock&plan=${plan}`, mock: true };
    }

    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) throw new BadRequestException('Invalid plan for checkout');

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: { tenantId: tenantId.toString() },
      });
      customerId = customer.id;
      tenant.stripeCustomerId = customerId;
      await tenant.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancel`,
      metadata: { tenantId: tenantId.toString(), plan },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody, signature) {
    const stripe = this.getStripe();
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!stripe || !webhookSecret) {
      return { received: true, mock: true };
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature failed: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const tenantId = sub.metadata?.tenantId;
        if (tenantId) {
          const plan = sub.metadata?.plan || PLANS.PROFESSIONAL;
          await this.tenantModel.findByIdAndUpdate(tenantId, {
            plan,
            stripeSubscriptionId: sub.id,
            billingPeriodEnd: new Date(sub.current_period_end * 1000),
            status: sub.status === 'active' ? 'active' : 'trial',
          });
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
        if (tenant) {
          const invoices = tenant.settings?.billing?.invoices || [];
          invoices.unshift({
            id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status,
            date: new Date(invoice.created * 1000).toISOString(),
            pdfUrl: invoice.invoice_pdf,
          });
          tenant.settings = {
            ...(tenant.settings || {}),
            billing: { ...(tenant.settings?.billing || {}), invoices: invoices.slice(0, 24) },
          };
          tenant.markModified('settings');
          await tenant.save();
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }
}

defineParamTypes(BillingService, SubscriptionService, ConfigService);

module.exports = { BillingService };
