const {
  Injectable,
  BadRequestException,
  NotFoundException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { SubscriptionService } = require('./subscription.service');
const { PLANS } = require('../../common/constants/plans');
const { defineParamTypes } = require('../../common/define-param-types');
const { emitNotification } = require('../../realtime/socket-hub');

const PLAN_PRICE_MAP = {
  [PLANS.PROFESSIONAL]: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
  [PLANS.BUSINESS]: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
  [PLANS.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
};

@Injectable()
class BillingService {
  tenantModel;
  userTenantModel;
  notificationModel;
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

  async getBillingSummary(tenantId, userId) {
    const tenant = await this.tenantModel.findById(tenantId).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const limits = this.subscriptionService.getPlanLimits(tenant.plan);
    const trialEndsAt = tenant.trialEndsAt || null;
    const trialDaysRemaining = trialEndsAt
      ? Math.max(Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)), 0)
      : null;
    const subscriptionDaysRemaining = tenant.billingPeriodEnd
      ? Math.max(Math.ceil((new Date(tenant.billingPeriodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)), 0)
      : null;
    const activeUsers = await this.userTenantModel.countDocuments({
      tenantId,
      isActive: true,
    });
    await this.ensureTrialReminder(tenant, userId, trialDaysRemaining);

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
      trialEndsAt,
      trialDaysRemaining,
      subscriptionDaysRemaining,
      availablePlans: this.subscriptionService.getPublicPlans().plans,
      invoices: tenant.settings?.billing?.invoices || [],
    };
  }

  async createPortalSession(tenantId, returnUrl, userId) {
    const stripe = this.getStripe();
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!stripe) {
      const mockUrl = `${returnUrl}?billing=mock`;
      await this.notifyUser(tenantId, userId, {
        type: 'billing.portal',
        title: 'Billing portal opened',
        body: 'Stripe is not configured, so a mock billing portal was used.',
        href: '/settings/billing',
        entityType: 'Tenant',
        entityId: tenantId,
      });
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

  async createCheckoutSession(tenantId, plan, returnUrl, userId) {
    const stripe = this.getStripe();
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) throw new BadRequestException('Invalid plan for checkout');

    if (!stripe) {
      await this.notifyUser(tenantId, userId, {
        type: 'billing.checkout',
        title: `Checkout started for ${plan}`,
        body: 'Stripe is not configured, so a mock checkout URL was returned.',
        href: '/settings/billing',
        entityType: 'Tenant',
        entityId: tenantId,
      });
      return { url: `${returnUrl}?checkout=mock&plan=${plan}`, mock: true };
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancel`,
      metadata: { tenantId: tenantId.toString(), plan },
    });

    await this.notifyUser(tenantId, userId, {
      type: 'billing.checkout',
      title: `Checkout started for ${plan}`,
      body: 'Complete checkout to activate your subscription.',
      href: '/settings/billing',
      entityType: 'Tenant',
      entityId: tenantId,
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
          await this.notifyTenantAdmins(tenantId, {
            type: 'billing.subscription',
            title: `Subscription updated to ${plan}`,
            body: `Stripe subscription is now ${sub.status}.`,
            href: '/settings/billing',
            entityType: 'Tenant',
            entityId: tenantId,
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

  async notifyUser(tenantId, userId, payload) {
    if (!this.notificationModel || !userId) return null;
    const note = await this.notificationModel.create({
      tenantId,
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body || '',
      href: payload.href || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      read: false,
    });
    const formatted = { ...note.toObject(), id: note._id.toString() };
    delete formatted._id;
    delete formatted.__v;
    emitNotification(tenantId, String(userId), formatted);
    return formatted;
  }

  async notifyTenantAdmins(tenantId, payload) {
    const members = await this.userTenantModel
      .find({ tenantId, isActive: true, role: { $in: ['owner', 'admin'] } })
      .lean();
    await Promise.all(members.map((member) => this.notifyUser(tenantId, member.userId, payload)));
  }

  async ensureTrialReminder(tenant, userId, trialDaysRemaining) {
    if (!this.notificationModel || !userId || tenant.status !== 'trial' || trialDaysRemaining == null) return;
    if (trialDaysRemaining > 3) return;
    const type = trialDaysRemaining === 0 ? 'trial.expired' : 'trial.ending';
    const existing = await this.notificationModel.findOne({
      tenantId: tenant._id,
      userId,
      type,
      read: false,
    });
    if (existing) return;
    await this.notifyUser(tenant._id, userId, {
      type,
      title: trialDaysRemaining === 0 ? 'Trial ended' : 'Trial ending soon',
      body:
        trialDaysRemaining === 0
          ? 'Your trial has ended. Choose a paid plan to keep the workspace active.'
          : `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'}. Choose a plan to avoid interruption.`,
      href: '/settings/billing',
      entityType: 'Tenant',
      entityId: tenant._id,
    });
  }
}

defineParamTypes(BillingService, SubscriptionService, ConfigService);

module.exports = { BillingService };
