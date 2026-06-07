/** Config for PRD module hub placeholder pages */
export const MODULE_PAGES = {
  quotations: {
    title: 'Quotations',
    description: 'Create, send, and track sales quotations.',
    comingSoon: false,
    features: [
      { title: 'Quote builder', description: 'Line items, discounts, and PDF export', items: ['Templates', 'E-sign ready', 'Version history'] },
      { title: 'Approval workflow', description: 'Manager sign-off before sending', items: ['Discount thresholds', 'Audit trail'] },
    ],
  },
  orders: {
    title: 'Orders',
    description: 'Convert won deals into orders and fulfillment.',
    comingSoon: false,
    features: [{ title: 'Order management', items: ['From opportunity', 'Inventory sync', 'Status tracking'] }],
  },
  invoices: {
    title: 'Invoices',
    description: 'Billing and accounts receivable.',
    comingSoon: false,
    features: [{ title: 'Invoicing', items: ['Recurring billing', 'Payment links', 'Aging reports'] }],
  },
  campaigns: {
    title: 'Campaigns',
    description: 'Multi-channel marketing campaigns and attribution.',
    comingSoon: false,
    features: [{ title: 'Campaign hub', items: ['UTM tracking', 'ROI dashboard', 'A/B tests'] }],
  },
  sms: {
    title: 'SMS Marketing',
    description: 'Text message campaigns and two-way SMS.',
    comingSoon: false,
    features: [{ title: 'SMS', items: ['Segments', 'Opt-out compliance', 'Delivery reports'] }],
  },
  tickets: {
    title: 'Support tickets',
    description: 'Customer service ticket dashboard and workflows.',
    comingSoon: false,
    features: [
      { title: 'Ticket workflow', items: ['New → Assigned → In Progress → Resolved → Closed', 'SLA timers', 'Escalation rules'] },
    ],
  },
  chat: {
    title: 'Live chat',
    description: 'Real-time customer conversations.',
    comingSoon: false,
    features: [{ title: 'Live chat', items: ['Website widget', 'Agent routing', 'Chat history'] }],
  },
  knowledge: {
    title: 'Knowledge base',
    description: 'Self-service articles and FAQs.',
    comingSoon: false,
    features: [{ title: 'KB', items: ['Categories', 'Search', 'Customer portal'] }],
  },
  automation: {
    title: 'Automation',
    description: 'Visual workflow builder for leads, email, and tasks.',
    comingSoon: false,
    features: [
      { title: 'Workflow builder', description: 'HubSpot-style automation flows', items: ['Triggers', 'Delays', 'Conditions', 'Actions'] },
    ],
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect Google, Microsoft, Stripe, Zapier, and more.',
    comingSoon: false,
    features: [{ title: 'Connectors', items: ['Google Calendar', 'Outlook', 'Slack', 'Zapier', 'Stripe'] }],
  },
};
