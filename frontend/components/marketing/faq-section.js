'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const FAQS = [
  {
    q: 'How is tenant data isolated?',
    a: 'Each organization receives a dedicated tenant workspace with strict data boundaries. Customer records, configurations, and audit logs never commingle across tenants.',
  },
  {
    q: 'Does NexusCRM support SSO and RBAC?',
    a: 'Yes. Role-based access control is enforced at the object and department level. Enterprise plans include SAML and OIDC integration for single sign-on.',
  },
  {
    q: 'What audit and compliance capabilities are included?',
    a: 'All configuration changes, permission updates, and data exports are logged. Enterprise plans support extended retention and export for compliance reviews.',
  },
  {
    q: 'Can we migrate from an existing CRM?',
    a: 'Import contacts and deals via CSV, or work with our team on a guided migration from HubSpot, Salesforce, or Pipedrive with minimal downtime.',
  },
  {
    q: 'How is billing structured for multi-tenant deployments?',
    a: 'Billing is managed per tenant through Stripe. Admins configure plans, seat limits, and add-ons from the workspace settings panel.',
  },
  {
    q: 'What integrations are available?',
    a: 'Connect Slack, Stripe, HubSpot, Zapier, Zendesk, GitHub, and more. Custom integrations and webhooks are available on Enterprise plans.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">FAQ</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Common questions from IT and RevOps
          </h2>
        </div>

        <Accordion className="marketing-card mx-auto w-full max-w-3xl p-3" defaultValue={['item-0']}>
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-border px-3">
              <AccordionTrigger className="py-5 text-left text-sm font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
