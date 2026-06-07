const { Injectable } = require('@nestjs/common');

@Injectable()
class IntegrationsService {
  emailAccountModel;
  tenantModel;

  async list(tenantId) {
    const [accounts, tenant] = await Promise.all([
      this.emailAccountModel.find({ tenantId }).lean(),
      this.tenantModel.findById(tenantId).lean(),
    ]);

    const billing = tenant?.settings?.billing || {};
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasZadarma = Boolean(process.env.ZADARMA_KEY && process.env.ZADARMA_SECRET);
    const hasRecaptcha = Boolean(process.env.RECAPTCHA_SECRET_KEY);

    return {
      integrations: [
        {
          key: 'email',
          name: 'Email (IMAP/SMTP)',
          status: accounts.length > 0 ? 'connected' : 'disconnected',
          detail: accounts.length > 0 ? `${accounts.length} account(s)` : 'No accounts configured',
          href: '/settings/email-accounts',
        },
        {
          key: 'google',
          name: 'Google OAuth',
          status: accounts.some((a) => a.provider === 'google') ? 'connected' : 'available',
          detail: 'Connect Gmail for outbound email',
          href: '/settings/email-accounts',
        },
        {
          key: 'stripe',
          name: 'Stripe Billing',
          status: hasStripe ? 'connected' : 'available',
          detail: hasStripe ? `Plan: ${tenant?.plan || '—'}` : 'Configure STRIPE_SECRET_KEY',
          href: '/settings/billing',
        },
        {
          key: 'voip',
          name: 'Zadarma VoIP',
          status: hasZadarma ? 'connected' : 'available',
          detail: hasZadarma ? 'Click-to-call enabled' : 'Configure ZADARMA_KEY',
        },
        {
          key: 'recaptcha',
          name: 'reCAPTCHA',
          status: hasRecaptcha ? 'connected' : 'available',
          detail: hasRecaptcha ? 'Public forms protected' : 'Configure RECAPTCHA_SECRET_KEY',
        },
        {
          key: 'massmail',
          name: 'Email Marketing',
          status: 'connected',
          detail: 'Mass mail campaigns',
          href: '/massmail',
        },
      ],
      emailAccounts: accounts.map((a) => ({
        id: a._id.toString(),
        email: a.email,
        provider: a.provider || 'imap',
        status: a.status || 'active',
      })),
      billing: {
        plan: tenant?.plan,
        stripeCustomerId: billing.stripeCustomerId || null,
        subscriptionStatus: billing.subscriptionStatus || null,
      },
    };
  }
}

module.exports = { IntegrationsService };
