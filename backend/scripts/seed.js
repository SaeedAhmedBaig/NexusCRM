/**
 * Seeds detailed demo data into an existing tenant.
 *
 * Usage:
 *   npm run seed -- --tenant=nexgensquad
 *   npm run seed -- --tenantId=665...
 *   TENANT_SUBDOMAIN=nexgensquad npm run seed
 *
 * The script is idempotent for data it creates: reruns remove previous
 * seed-owned records for the selected tenant and preserve user-created data.
 */
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const { TenantSchema } = require('../src/modules/tenant/schemas/tenant.schema');
const { UserSchema } = require('../src/modules/auth/schemas/user.schema');
const { UserTenantSchema } = require('../src/modules/auth/schemas/user-tenant.schema');
const { DepartmentSchema } = require('../src/modules/rbac/schemas/department.schema');
const { LeadSchema } = require('../src/modules/crm/schemas/lead.schema');
const { LeadRoutingRuleSchema } = require('../src/modules/crm/schemas/lead-routing-rule.schema');
const { CompanySchema } = require('../src/modules/crm/schemas/company.schema');
const { ContactSchema } = require('../src/modules/crm/schemas/contact.schema');
const { DealSchema } = require('../src/modules/crm/schemas/deal.schema');
const { DealPipelineSchema } = require('../src/modules/crm/schemas/deal-pipeline.schema');
const { RequestSchema } = require('../src/modules/crm/schemas/request.schema');
const { PaymentSchema } = require('../src/modules/crm/schemas/payment.schema');
const { TaskSchema } = require('../src/modules/crm/schemas/task.schema');
const { ProjectSchema } = require('../src/modules/tasks/schemas/project.schema');
const { MemoSchema } = require('../src/modules/tasks/schemas/memo.schema');
const { ProductSchema } = require('../src/modules/extensions/schemas/product.schema');
const { QuotationSchema } = require('../src/modules/extensions/schemas/quotation.schema');
const { OrderSchema } = require('../src/modules/extensions/schemas/order.schema');
const { InvoiceSchema } = require('../src/modules/extensions/schemas/invoice.schema');
const { TicketSchema } = require('../src/modules/extensions/schemas/ticket.schema');
const { TicketQueueSchema } = require('../src/modules/extensions/schemas/ticket-queue.schema');
const { TicketMacroSchema } = require('../src/modules/extensions/schemas/ticket-macro.schema');
const { SmsCampaignSchema } = require('../src/modules/extensions/schemas/sms-campaign.schema');
const { KnowledgeArticleSchema } = require('../src/modules/extensions/schemas/knowledge-article.schema');
const { LiveChatSessionSchema } = require('../src/modules/extensions/schemas/live-chat-session.schema');
const { AutomationRuleSchema } = require('../src/modules/extensions/schemas/automation-rule.schema');
const { AutomationRunSchema } = require('../src/modules/extensions/schemas/automation-run.schema');
const { ReportExportJobSchema } = require('../src/modules/extensions/schemas/report-export-job.schema');
const { EmailAccountSchema } = require('../src/modules/mail/schemas/email-account.schema');
const { MassmailCampaignSchema } = require('../src/modules/mail/schemas/massmail-campaign.schema');
const { MailboxThreadSchema } = require('../src/modules/mail/schemas/mailbox-thread.schema');
const { MailboxMessageSchema } = require('../src/modules/mail/schemas/mailbox-message.schema');
const { DataJobSchema } = require('../src/modules/data-jobs/schemas/data-job.schema');
const { CustomFieldSchema } = require('../src/modules/metadata/schemas/custom-field.schema');
const { FileAssetSchema } = require('../src/modules/files/schemas/file-asset.schema');
const { ChatMessageSchema } = require('../src/modules/realtime/schemas/chat-message.schema');
const { NotificationSchema } = require('../src/modules/realtime/schemas/notification.schema');
const { ActivityEventSchema } = require('../src/modules/activity/schemas/activity-event.schema');
const { ROLES } = require('../src/common/constants/roles');

function model(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

const models = {
  Tenant: model('Tenant', TenantSchema),
  User: model('User', UserSchema),
  UserTenant: model('UserTenant', UserTenantSchema),
  Department: model('Department', DepartmentSchema),
  Lead: model('Lead', LeadSchema),
  LeadRoutingRule: model('LeadRoutingRule', LeadRoutingRuleSchema),
  Company: model('Company', CompanySchema),
  Contact: model('Contact', ContactSchema),
  Deal: model('Deal', DealSchema),
  DealPipeline: model('DealPipeline', DealPipelineSchema),
  Request: model('Request', RequestSchema),
  Payment: model('Payment', PaymentSchema),
  Task: model('Task', TaskSchema),
  Project: model('Project', ProjectSchema),
  Memo: model('Memo', MemoSchema),
  Product: model('Product', ProductSchema),
  Quotation: model('Quotation', QuotationSchema),
  Order: model('Order', OrderSchema),
  Invoice: model('Invoice', InvoiceSchema),
  Ticket: model('Ticket', TicketSchema),
  TicketQueue: model('TicketQueue', TicketQueueSchema),
  TicketMacro: model('TicketMacro', TicketMacroSchema),
  SmsCampaign: model('SmsCampaign', SmsCampaignSchema),
  KnowledgeArticle: model('KnowledgeArticle', KnowledgeArticleSchema),
  LiveChatSession: model('LiveChatSession', LiveChatSessionSchema),
  AutomationRule: model('AutomationRule', AutomationRuleSchema),
  AutomationRun: model('AutomationRun', AutomationRunSchema),
  ReportExportJob: model('ReportExportJob', ReportExportJobSchema),
  EmailAccount: model('EmailAccount', EmailAccountSchema),
  MassmailCampaign: model('MassmailCampaign', MassmailCampaignSchema),
  MailboxThread: model('MailboxThread', MailboxThreadSchema),
  MailboxMessage: model('MailboxMessage', MailboxMessageSchema),
  DataJob: model('DataJob', DataJobSchema),
  CustomField: model('CustomField', CustomFieldSchema),
  FileAsset: model('FileAsset', FileAssetSchema),
  ChatMessage: model('ChatMessage', ChatMessageSchema),
  Notification: model('Notification', NotificationSchema),
  ActivityEvent: model('ActivityEvent', ActivityEventSchema),
};

function arg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

function configureDns() {
  if (process.env.DNS_SERVERS === 'system') return;
  const servers = (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function moneyLine(product, quantity, discount = 0) {
  const subtotal = quantity * product.unitPrice;
  const taxRate = product.isTaxable === false ? 0 : 8;
  const total = Math.round((subtotal - discount + (subtotal - discount) * (taxRate / 100)) * 100) / 100;
  return {
    productId: product._id,
    name: product.name,
    sku: product.sku,
    quantity,
    unitPrice: product.unitPrice,
    discount,
    taxRate,
    cost: product.cost || 0,
    total,
  };
}

function totals(lineItems) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = lineItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const taxable = item.quantity * item.unitPrice - (item.discount || 0);
    return sum + taxable * ((item.taxRate || 0) / 100);
  }, 0);
  const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;
  return { subtotal, discountTotal, taxTotal: Math.round(taxTotal * 100) / 100, grandTotal, amount: grandTotal };
}

async function findTenant() {
  const tenantId = arg('tenantId') || process.env.TENANT_ID;
  const subdomain = arg('tenant') || arg('subdomain') || process.env.TENANT_SUBDOMAIN;

  if (tenantId) return models.Tenant.findById(tenantId);
  if (subdomain) return models.Tenant.findOne({ subdomain: String(subdomain).toLowerCase().trim() });

  throw new Error('Provide --tenant=<subdomain>, --tenantId=<id>, TENANT_SUBDOMAIN, or TENANT_ID.');
}

async function purgeSeedData(tenant, seedEmailRegex) {
  const tenantId = tenant._id;
  const seededUsers = await models.User.find({ email: seedEmailRegex }).select('_id').lean();
  const seededUserIds = seededUsers.map((user) => user._id);

  await Promise.all([
    models.UserTenant.deleteMany({ tenantId, userId: { $in: seededUserIds } }),
    models.User.deleteMany({ _id: { $in: seededUserIds } }),
    models.Department.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.Lead.deleteMany({ tenantId, 'customFields.seed': true }),
    models.LeadRoutingRule.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.Company.deleteMany({ tenantId, 'customFields.seed': true }),
    models.Contact.deleteMany({ tenantId, 'customFields.seed': true }),
    models.Deal.deleteMany({ tenantId, 'customFields.seed': true }),
    models.DealPipeline.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.Request.deleteMany({ tenantId, 'customFields.seed': true }),
    models.Payment.deleteMany({ tenantId, note: /^\[Seed\]/ }),
    models.Task.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.Project.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.Memo.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.Product.deleteMany({ tenantId, 'customFields.seed': true }),
    models.Quotation.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.Order.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.Invoice.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.Ticket.deleteMany({ tenantId, 'customFields.seed': true }),
    models.TicketQueue.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.TicketMacro.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.SmsCampaign.deleteMany({ tenantId, 'customFields.seed': true }),
    models.KnowledgeArticle.deleteMany({ tenantId, 'customFields.seed': true }),
    models.LiveChatSession.deleteMany({ tenantId, 'customFields.seed': true }),
    models.AutomationRule.deleteMany({ tenantId, 'customFields.seed': true }),
    models.AutomationRun.deleteMany({ tenantId, eventId: /^seed-/ }),
    models.ReportExportJob.deleteMany({ tenantId, title: /^\[Seed\]/ }),
    models.EmailAccount.deleteMany({ tenantId, email: seedEmailRegex }),
    models.MassmailCampaign.deleteMany({ tenantId, name: /^\[Seed\]/ }),
    models.MailboxThread.deleteMany({ tenantId, providerThreadId: /^seed-/ }),
    models.MailboxMessage.deleteMany({ tenantId, providerMessageId: /^seed-/ }),
    models.DataJob.deleteMany({ tenantId, source: 'seed' }),
    models.CustomField.deleteMany({ tenantId, key: /^seed_/ }),
    models.FileAsset.deleteMany({ tenantId, 'metadata.seed': true }),
    models.ChatMessage.deleteMany({ tenantId, body: /^\[Seed\]/ }),
    models.Notification.deleteMany({ tenantId, type: /^seed\./ }),
    models.ActivityEvent.deleteMany({ tenantId, source: 'seed' }),
  ]);
}

async function createSeedUsers(tenant) {
  const passwordHash = await bcrypt.hash('SeedUser@2026', 10);
  const base = `${tenant.subdomain}.example.test`;
  const users = await models.User.insertMany([
    { name: 'Ayesha Khan', email: `seed.sales.manager@${base}`, passwordHash, emailVerified: true, isActive: true },
    { name: 'Omar Farooq', email: `seed.support.lead@${base}`, passwordHash, emailVerified: true, isActive: true },
    { name: 'Mina Patel', email: `seed.marketing.ops@${base}`, passwordHash, emailVerified: true, isActive: true },
    { name: 'Bilal Ahmed', email: `seed.finance.ops@${base}`, passwordHash, emailVerified: true, isActive: true },
  ]);

  await models.UserTenant.insertMany([
    { tenantId: tenant._id, userId: users[0]._id, role: ROLES.MANAGER, isActive: true },
    { tenantId: tenant._id, userId: users[1]._id, role: ROLES.OPERATOR, isActive: true },
    { tenantId: tenant._id, userId: users[2]._id, role: ROLES.OPERATOR, isActive: true },
    { tenantId: tenant._id, userId: users[3]._id, role: ROLES.ACCOUNTANT, isActive: true },
  ]);

  return users;
}

async function createStorageAsset(tenant, user, name, content, purpose, entityType = 'Seed') {
  const storageRoot = path.resolve(process.env.LOCAL_FILE_STORAGE_DIR || path.join(__dirname, '..', 'storage'));
  const tenantFolder = path.join(storageRoot, String(tenant._id));
  await fsp.mkdir(tenantFolder, { recursive: true });
  const filename = `${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]+/g, '-')}`;
  const storageKey = path.join(String(tenant._id), filename);
  const absolutePath = path.join(storageRoot, storageKey);
  await fsp.writeFile(absolutePath, content);
  return models.FileAsset.create({
    tenantId: tenant._id,
    filename,
    originalName: name,
    mimeType: 'text/plain',
    size: Buffer.byteLength(content),
    storageProvider: 'local',
    storageKey,
    entityType,
    purpose,
    checksum: crypto.createHash('sha256').update(content).digest('hex'),
    uploadedBy: user._id,
    metadata: { seed: true, generatedBy: 'backend/scripts/seed.js' },
  });
}

async function run() {
  loadEnv();
  configureDns();
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_saas';
  await mongoose.connect(uri);

  const tenant = await findTenant();
  if (!tenant) throw new Error('Tenant not found.');

  const seedEmailRegex = new RegExp(`^seed\\..+@${escapeRegExp(tenant.subdomain)}\\.example\\.test$`);
  console.log(`Seeding tenant: ${tenant.name} (${tenant.subdomain})`);
  await purgeSeedData(tenant, seedEmailRegex);

  const existingMembership = await models.UserTenant.findOne({ tenantId: tenant._id, isActive: true }).populate('userId').lean();
  const owner = existingMembership?.userId;
  if (!owner) throw new Error('Tenant has no active user membership to use as creator.');

  const seedUsers = await createSeedUsers(tenant);
  const [salesUser, supportUser, marketingUser, financeUser] = seedUsers;
  const allUsers = [owner, ...seedUsers];

  const departments = await models.Department.insertMany([
    { tenantId: tenant._id, name: '[Seed] Revenue Operations', description: 'Owns pipeline hygiene, forecasting, and sales operations.' },
    { tenantId: tenant._id, name: '[Seed] Customer Success', description: 'Owns onboarding, renewals, support, and customer health.' },
    { tenantId: tenant._id, name: '[Seed] Finance Desk', description: 'Owns invoicing, collections, and billing operations.' },
  ]);

  const pipeline = await models.DealPipeline.create({
    tenantId: tenant._id,
    name: '[Seed] Enterprise Sales Pipeline',
    description: 'Demo pipeline for SaaS enterprise opportunities.',
    isDefault: true,
    active: true,
    stages: [
      { key: 'discovery', label: 'Discovery', probability: 20, order: 1, exitCriteria: 'Need, budget, authority identified.' },
      { key: 'solution_fit', label: 'Solution Fit', probability: 45, order: 2, exitCriteria: 'Demo completed and success criteria documented.' },
      { key: 'proposal', label: 'Proposal', probability: 65, order: 3, exitCriteria: 'Commercial proposal sent.' },
      { key: 'legal', label: 'Legal Review', probability: 80, order: 4, exitCriteria: 'MSA and security review in progress.' },
      { key: 'closed_won', label: 'Closed Won', probability: 100, order: 5, isWon: true },
      { key: 'closed_lost', label: 'Closed Lost', probability: 0, order: 6, isLost: true },
    ],
  });

  const companies = await models.Company.insertMany([
    {
      tenantId: tenant._id,
      name: 'Acme Manufacturing Group',
      industry: 'Manufacturing',
      website: 'https://acme-manufacturing.example',
      phone: '+1 212 555 0101',
      lifecycleStage: 'active_customer',
      healthScore: 82,
      healthStatus: 'healthy',
      accountTier: 'enterprise',
      renewalDate: daysFromNow(75),
      assignedTo: salesUser._id,
      departmentId: departments[0]._id,
      ownerNotes: 'Strategic account expanding from sales CRM into service desk and automation.',
      accountPlan: {
        goals: 'Consolidate five regional sales teams onto one CRM workspace.',
        successCriteria: 'Reduce lead response time by 40% and improve forecast accuracy.',
        risks: 'Security review and data migration complexity.',
        nextSteps: 'Schedule executive business review and technical migration workshop.',
        stakeholders: 'VP Sales, Director IT, Revenue Operations Manager.',
        renewalStrategy: 'Position Business plan renewal with automation and custom fields.',
      },
      communicationPreferences: { emailOptIn: true, preferredChannel: 'email', notes: 'Send executive summaries monthly.' },
      customFields: { seed: true, region: 'North America', arr: 144000 },
    },
    {
      tenantId: tenant._id,
      name: 'BluePeak Logistics',
      industry: 'Logistics',
      website: 'https://bluepeak-logistics.example',
      phone: '+44 20 7946 0102',
      lifecycleStage: 'qualified',
      healthScore: 64,
      healthStatus: 'neutral',
      accountTier: 'strategic',
      renewalDate: daysFromNow(120),
      assignedTo: salesUser._id,
      departmentId: departments[0]._id,
      ownerNotes: 'Evaluating sales pipeline, shared inbox, and customer success workflows.',
      customFields: { seed: true, region: 'EMEA', arr: 72000 },
    },
    {
      tenantId: tenant._id,
      name: 'Northstar Clinics',
      industry: 'Healthcare',
      website: 'https://northstar-clinics.example',
      phone: '+1 415 555 0130',
      lifecycleStage: 'at_risk',
      healthScore: 38,
      healthStatus: 'at_risk',
      accountTier: 'standard',
      renewalDate: daysFromNow(25),
      assignedTo: supportUser._id,
      departmentId: departments[1]._id,
      ownerNotes: 'At risk due to unresolved inbox sync and onboarding delays.',
      customFields: { seed: true, region: 'West', arr: 24000 },
    },
  ]);

  const contacts = await models.Contact.insertMany([
    { tenantId: tenant._id, firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell@acme-manufacturing.example', phone: '+1 212 555 0198', jobTitle: 'VP Sales', companyId: companies[0]._id, assignedTo: salesUser._id, departmentId: departments[0]._id, customFields: { seed: true, persona: 'economic_buyer' } },
    { tenantId: tenant._id, firstName: 'David', lastName: 'Chen', email: 'david.chen@acme-manufacturing.example', phone: '+1 212 555 0199', jobTitle: 'IT Director', companyId: companies[0]._id, assignedTo: supportUser._id, departmentId: departments[1]._id, customFields: { seed: true, persona: 'technical_buyer' } },
    { tenantId: tenant._id, firstName: 'Amelia', lastName: 'Stone', email: 'amelia.stone@bluepeak-logistics.example', phone: '+44 20 7946 0190', jobTitle: 'Revenue Operations Lead', companyId: companies[1]._id, assignedTo: salesUser._id, customFields: { seed: true, persona: 'champion' } },
    { tenantId: tenant._id, firstName: 'Rafael', lastName: 'Ortega', email: 'rafael.ortega@northstar-clinics.example', phone: '+1 415 555 0195', jobTitle: 'Operations Manager', companyId: companies[2]._id, assignedTo: supportUser._id, customFields: { seed: true, persona: 'admin' } },
  ]);

  const products = await models.Product.insertMany([
    { tenantId: tenant._id, name: 'NexusCRM Professional Seats', sku: 'NX-PRO-SEAT', description: 'Professional CRM user seat with sales, service, and inbox access.', category: 'Subscription', type: 'recurring', billingPeriod: 'monthly', unitPrice: 29, cost: 4, currency: 'USD', createdBy: financeUser._id, assignedTo: financeUser._id, customFields: { seed: true } },
    { tenantId: tenant._id, name: 'NexusCRM Business Automation Pack', sku: 'NX-BIZ-AUTO', description: 'Automation runtime, custom fields, security center, and data jobs.', category: 'Subscription', type: 'recurring', billingPeriod: 'monthly', unitPrice: 59, cost: 8, currency: 'USD', createdBy: financeUser._id, assignedTo: financeUser._id, customFields: { seed: true } },
    { tenantId: tenant._id, name: 'Implementation Workshop', sku: 'NX-IMPL-WKS', description: 'Two-day guided implementation and migration workshop.', category: 'Services', type: 'service', unitPrice: 2500, cost: 900, currency: 'USD', createdBy: financeUser._id, assignedTo: salesUser._id, customFields: { seed: true } },
  ]);

  const dealItemsA = [moneyLine(products[1], 40, 300), moneyLine(products[2], 1)];
  const dealItemsB = [moneyLine(products[0], 25), moneyLine(products[2], 1, 250)];
  const dealTotalsA = totals(dealItemsA);
  const dealTotalsB = totals(dealItemsB);
  const deals = await models.Deal.insertMany([
    { tenantId: tenant._id, title: '[Seed] Acme global rollout', pipelineId: pipeline._id, stageKey: 'legal', stage: 'negotiation', probability: 80, forecastCategory: 'commit', status: 'open', value: dealTotalsA.grandTotal, ...dealTotalsA, lineItems: dealItemsA, closeDate: daysFromNow(21), nextStep: 'Complete security review and procurement redlines.', nextStepDueAt: daysFromNow(3), companyId: companies[0]._id, contactId: contacts[0]._id, assignedTo: salesUser._id, departmentId: departments[0]._id, description: 'Enterprise expansion opportunity for sales, support, and automation teams.', customFields: { seed: true, competitor: 'Legacy CRM' } },
    { tenantId: tenant._id, title: '[Seed] BluePeak revenue operations launch', pipelineId: pipeline._id, stageKey: 'proposal', stage: 'proposal', probability: 65, forecastCategory: 'best_case', status: 'open', value: dealTotalsB.grandTotal, ...dealTotalsB, lineItems: dealItemsB, closeDate: daysFromNow(40), nextStep: 'Review proposal with RevOps steering committee.', nextStepDueAt: daysFromNow(5), companyId: companies[1]._id, contactId: contacts[2]._id, assignedTo: salesUser._id, departmentId: departments[0]._id, description: 'Professional rollout with implementation workshop.', customFields: { seed: true, competitor: 'Spreadsheet process' } },
    { tenantId: tenant._id, title: '[Seed] Northstar renewal rescue', pipelineId: pipeline._id, stageKey: 'solution_fit', stage: 'qualified', probability: 45, forecastCategory: 'pipeline', status: 'open', value: 18000, closeDate: daysFromNow(25), nextStep: 'Resolve inbox sync blocker and confirm renewal path.', nextStepDueAt: daysFromNow(2), companyId: companies[2]._id, contactId: contacts[3]._id, assignedTo: supportUser._id, departmentId: departments[1]._id, description: 'At-risk renewal requiring service desk attention.', customFields: { seed: true, risk: 'High' } },
  ]);

  const leads = await models.Lead.insertMany([
    { tenantId: tenant._id, title: 'Enterprise CRM evaluation from web form', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@helio-retail.example', phone: '+1 646 555 0108', companyName: 'Helio Retail', jobTitle: 'Chief Revenue Officer', source: 'website', status: 'qualified', qualificationStage: 'sql', score: 87, scoreBreakdown: { fit: 32, engagement: 28, intent: 27, notes: 'Requested demo and pricing for 80 users.' }, routingStatus: 'routed', routedAt: daysAgo(1), value: 88000, assignedTo: salesUser._id, departmentId: departments[0]._id, customFields: { seed: true, campaign: 'pricing_page' } },
    { tenantId: tenant._id, title: 'Partner referral for service desk', firstName: 'Marcus', lastName: 'Lee', email: 'marcus.lee@atlas-energy.example', phone: '+1 713 555 0112', companyName: 'Atlas Energy', jobTitle: 'Support Director', source: 'partner', status: 'contacted', qualificationStage: 'mql', score: 71, scoreBreakdown: { fit: 26, engagement: 22, intent: 23, notes: 'Interested in queues and macros.' }, routingStatus: 'routed', routedAt: daysAgo(2), value: 42000, assignedTo: supportUser._id, departmentId: departments[1]._id, customFields: { seed: true, campaign: 'partner_webinar' } },
    { tenantId: tenant._id, title: 'Trade show badge scan - duplicate candidate', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell@acme-manufacturing.example', companyName: 'Acme Manufacturing Group', source: 'trade_show', status: 'new', qualificationStage: 'raw', score: 54, routingStatus: 'unrouted', value: 12000, duplicateCandidateIds: [], assignedTo: marketingUser._id, customFields: { seed: true, campaign: 'expo_2026' } },
  ]);
  leads[2].duplicateCandidateIds = [leads[0]._id];
  await leads[2].save();

  const leadRoutingRules = await models.LeadRoutingRule.insertMany([
    { tenantId: tenant._id, name: '[Seed] Enterprise web leads to Sales', description: 'Route high-value website SQLs to revenue operations.', priority: 10, active: true, criteria: { sources: ['website'], qualificationStages: ['sql'], minValue: 50000, keywords: ['enterprise', 'pricing'] }, strategy: 'fixed_owner', assignedTo: salesUser._id, departmentId: departments[0]._id, runCount: 12, lastRunAt: daysAgo(1) },
    { tenantId: tenant._id, name: '[Seed] Service desk referrals to CS', description: 'Route partner support leads to customer success.', priority: 20, active: true, criteria: { sources: ['partner'], keywords: ['support', 'service'] }, strategy: 'fixed_owner', assignedTo: supportUser._id, departmentId: departments[1]._id, runCount: 7, lastRunAt: daysAgo(2) },
  ]);

  const requests = await models.Request.insertMany([
    { tenantId: tenant._id, title: '[Seed] Public demo request from Helio Retail', description: 'Prospect requested CRM demo with automation and reports.', status: 'pending', source: 'web_form', departmentId: departments[0]._id, assignedTo: salesUser._id, createdBy: owner._id, submitterName: 'Priya Nair', submitterEmail: 'priya.nair@helio-retail.example', submitterPhone: '+1 646 555 0108', country: 'US', city: 'New York', formData: { employees: 350, interest: ['sales', 'automation', 'analytics'] }, customFields: { seed: true } },
    { tenantId: tenant._id, title: '[Seed] Internal approval for migration workshop', description: 'Finance approval needed for discounted implementation workshop.', status: 'approved', source: 'internal', departmentId: departments[2]._id, assignedTo: financeUser._id, createdBy: salesUser._id, formData: { discount: 250, reason: 'Strategic logo' }, customFields: { seed: true } },
  ]);

  await models.Payment.insertMany([
    { tenantId: tenant._id, dealId: deals[0]._id, amount: 5000, currency: 'USD', status: 'completed', paidAt: daysAgo(8), note: '[Seed] Pilot deposit received', createdBy: financeUser._id },
    { tenantId: tenant._id, dealId: deals[1]._id, amount: 1250, currency: 'USD', status: 'pending', note: '[Seed] Implementation retainer pending procurement approval', createdBy: financeUser._id },
  ]);

  const projects = await models.Project.insertMany([
    { tenantId: tenant._id, name: '[Seed] Acme implementation project', description: 'Coordinate discovery, migration, pilot rollout, and training.', status: 'active', color: '#14B8A6', createdBy: salesUser._id, dueDate: daysFromNow(45) },
    { tenantId: tenant._id, name: '[Seed] Northstar renewal rescue plan', description: 'Stabilize inbox sync and close support blockers before renewal.', status: 'active', color: '#F59E0B', createdBy: supportUser._id, dueDate: daysFromNow(20) },
  ]);

  const tasks = await models.Task.insertMany([
    { tenantId: tenant._id, title: '[Seed] Prepare Acme security review package', description: 'Collect SOC2, data residency, and RBAC screenshots for IT review.', status: 'in_progress', priority: 'high', projectId: projects[0]._id, assignedTo: supportUser._id, assignees: [supportUser._id, salesUser._id], createdBy: salesUser._id, dueDate: daysFromNow(2), nextStep: 'Upload latest security document set.', progress: 55, subtasks: [{ title: 'Export RBAC matrix', completed: true, assignedTo: salesUser._id, order: 1 }, { title: 'Attach security PDF', completed: false, assignedTo: supportUser._id, order: 2 }], comments: [{ userId: salesUser._id, userName: 'Ayesha Khan', body: 'Customer asked for tenant isolation details.' }], workflowLog: [{ userId: salesUser._id, userName: 'Ayesha Khan', action: 'created', note: 'Seed task created for implementation testing.' }] },
    { tenantId: tenant._id, title: '[Seed] Resolve Northstar inbox sync blocker', description: 'Validate IMAP settings and shared inbox mapping.', status: 'todo', priority: 'urgent', projectId: projects[1]._id, assignedTo: supportUser._id, assignees: [supportUser._id], createdBy: owner._id, dueDate: daysFromNow(1), nextStep: 'Check OAuth callback configuration.', progress: 10, subtasks: [{ title: 'Verify connected account', completed: false, assignedTo: supportUser._id, order: 1 }] },
    { tenantId: tenant._id, title: '[Seed] Review BluePeak proposal discount', description: 'Confirm implementation workshop pricing and approval request.', status: 'done', priority: 'medium', assignedTo: financeUser._id, assignees: [financeUser._id], createdBy: salesUser._id, dueDate: daysAgo(1), progress: 100, comments: [{ userId: financeUser._id, userName: 'Bilal Ahmed', body: 'Approved discount within strategic account threshold.' }] },
  ]);

  await models.Memo.insertMany([
    { tenantId: tenant._id, title: '[Seed] Product feedback from Acme demo', content: 'Customer liked custom pipelines but asked for stronger role templates and audit exports.', status: 'pending', createdBy: salesUser._id },
    { tenantId: tenant._id, title: '[Seed] Renewal risk notes for Northstar', content: 'Primary risk is support responsiveness. Queue rules and macro templates should be demonstrated.', status: 'reviewed', createdBy: supportUser._id, reviewedBy: owner._id, reviewedAt: daysAgo(1), convertedToType: 'task', convertedToId: tasks[1]._id },
  ]);

  const quoteItems = [moneyLine(products[1], 40, 300), moneyLine(products[2], 1)];
  const quoteTotals = totals(quoteItems);
  const quotation = await models.Quotation.create({ tenantId: tenant._id, title: '[Seed] Acme Business rollout quotation', number: 'Q-SEED-1001', status: 'sent', ...quoteTotals, currency: 'USD', lineItems: quoteItems, dealId: deals[0]._id, contactId: contacts[0]._id, companyId: companies[0]._id, assignedTo: salesUser._id, validUntil: daysFromNow(20), terms: 'Net 30. Annual commitment with monthly billing.', notes: 'Includes implementation workshop and 40 Business seats.', billingAddress: 'Acme HQ, 100 Industrial Way', shippingAddress: 'Digital delivery', sentAt: daysAgo(2), createdBy: salesUser._id, customFields: { seed: true } });
  const order = await models.Order.create({ tenantId: tenant._id, title: '[Seed] BluePeak Professional launch order', orderNumber: 'O-SEED-2001', status: 'confirmed', ...dealTotalsB, currency: 'USD', lineItems: dealItemsB, dealId: deals[1]._id, contactId: contacts[2]._id, companyId: companies[1]._id, assignedTo: salesUser._id, terms: 'Net 15. Pilot rollout.', notes: 'Procurement requested staged rollout.', billingAddress: 'BluePeak London Office', shippingAddress: 'Digital delivery', confirmedAt: daysAgo(3), sourceQuotationId: quotation._id, createdBy: salesUser._id, customFields: { seed: true } });
  await models.Invoice.create({ tenantId: tenant._id, title: '[Seed] Acme pilot deposit invoice', invoiceNumber: 'INV-SEED-3001', status: 'sent', ...quoteTotals, currency: 'USD', lineItems: quoteItems, dueDate: daysFromNow(15), dealId: deals[0]._id, contactId: contacts[0]._id, companyId: companies[0]._id, assignedTo: financeUser._id, terms: 'Due on receipt for pilot deposit.', notes: 'Deposit invoice for procurement approval.', billingAddress: 'Acme HQ, 100 Industrial Way', shippingAddress: 'Digital delivery', sentAt: daysAgo(1), sourceQuotationId: quotation._id, sourceOrderId: order._id, createdBy: financeUser._id, customFields: { seed: true } });

  const queues = await models.TicketQueue.insertMany([
    { tenantId: tenant._id, name: '[Seed] Enterprise Support', description: 'Priority queue for strategic and enterprise accounts.', status: 'active', priority: 'high', defaultAssignee: supportUser._id, departmentId: departments[1]._id, slaPolicy: { firstResponseHours: 4, resolutionHours: 24, businessHoursOnly: true }, routingRules: { accountTier: ['enterprise', 'strategic'] }, assignedTo: supportUser._id, createdBy: owner._id },
    { tenantId: tenant._id, name: '[Seed] Billing Desk', description: 'Finance queue for invoices, plans, and payment questions.', status: 'active', priority: 'medium', defaultAssignee: financeUser._id, departmentId: departments[2]._id, slaPolicy: { firstResponseHours: 8, resolutionHours: 48, businessHoursOnly: true }, assignedTo: financeUser._id, createdBy: owner._id },
  ]);
  await models.TicketMacro.insertMany([
    { tenantId: tenant._id, name: '[Seed] IMAP troubleshooting response', category: 'Inbox', status: 'active', subject: 'Inbox sync troubleshooting steps', body: 'Hi {{contact.firstName}}, we are checking your IMAP host, port, OAuth state, and folder mapping. We will update you within the SLA window.', visibility: 'team', tags: ['imap', 'sync'], usageCount: 8, assignedTo: supportUser._id, createdBy: supportUser._id },
    { tenantId: tenant._id, name: '[Seed] Billing renewal reminder', category: 'Billing', status: 'active', subject: 'Plan renewal details', body: 'Your plan renewal is approaching. Please review billing settings or contact finance for purchase order support.', visibility: 'team', tags: ['billing', 'renewal'], usageCount: 3, assignedTo: financeUser._id, createdBy: financeUser._id },
  ]);
  const tickets = await models.Ticket.insertMany([
    { tenantId: tenant._id, title: '[Seed] Northstar shared inbox sync failing', description: 'Customer reports Gmail messages are not appearing in shared inbox.', status: 'in_progress', priority: 'urgent', channel: 'email', queueId: queues[0]._id, firstResponseDueAt: daysFromNow(0.2), firstResponseAt: daysAgo(0.4), slaDueAt: daysFromNow(1), lastCustomerReplyAt: daysAgo(0.5), lastAgentReplyAt: daysAgo(0.3), statusChangedAt: daysAgo(0.3), escalationLevel: 1, tags: ['gmail', 'inbox', 'renewal-risk'], internalNotes: 'Renewal account. Keep response crisp and executive-visible.', contactId: contacts[3]._id, companyId: companies[2]._id, dealId: deals[2]._id, assignedTo: supportUser._id, createdBy: supportUser._id, conversation: [{ body: 'We are not seeing new Gmail messages in the shared inbox.', authorName: 'Rafael Ortega', visibility: 'public', direction: 'inbound' }, { body: 'We are validating the OAuth token and IMAP fallback now.', authorId: supportUser._id, authorName: 'Omar Farooq', visibility: 'public', direction: 'outbound' }], customFields: { seed: true } },
    { tenantId: tenant._id, title: '[Seed] Acme invoice purchase order question', description: 'Customer needs PO number added before invoice payment.', status: 'pending', priority: 'medium', channel: 'portal', queueId: queues[1]._id, firstResponseDueAt: daysFromNow(0.4), slaDueAt: daysFromNow(2), tags: ['invoice', 'po'], contactId: contacts[0]._id, companyId: companies[0]._id, dealId: deals[0]._id, assignedTo: financeUser._id, createdBy: financeUser._id, conversation: [{ body: 'Please add PO-ACME-2026-CRM before we process payment.', authorName: 'Sarah Mitchell', visibility: 'public', direction: 'inbound' }], customFields: { seed: true } },
  ]);

  const emailAccount = await models.EmailAccount.create({ tenantId: tenant._id, name: '[Seed] Shared Revenue Inbox', email: `seed.revenue@${tenant.subdomain}.example.test`, provider: 'imap', smtpHost: 'smtp.example.test', smtpPort: 587, smtpUser: `seed.revenue@${tenant.subdomain}.example.test`, imapHost: 'imap.example.test', imapPort: 993, imapUser: `seed.revenue@${tenant.subdomain}.example.test`, isMain: true, doMassmail: true, doImport: true, lastSyncAt: daysAgo(0.2), createdBy: marketingUser._id });
  const threads = await models.MailboxThread.insertMany([
    { tenantId: tenant._id, accountId: emailAccount._id, provider: 'imap', providerThreadId: 'seed-thread-acme-security', subject: 'Security review materials', participants: ['sarah.mitchell@acme-manufacturing.example', emailAccount.email], preview: 'Can you send over your RBAC and audit export documentation?', status: 'open', read: false, labels: ['sales', 'security'], assignedTo: salesUser._id, linkedEntityType: 'Deal', linkedEntityId: deals[0]._id, lastMessageAt: daysAgo(0.5) },
    { tenantId: tenant._id, accountId: emailAccount._id, provider: 'imap', providerThreadId: 'seed-thread-northstar-sync', subject: 'Shared inbox still delayed', participants: ['rafael.ortega@northstar-clinics.example', emailAccount.email], preview: 'Messages are still delayed by about twenty minutes.', status: 'open', read: true, labels: ['support', 'renewal'], assignedTo: supportUser._id, linkedEntityType: 'Ticket', linkedEntityId: tickets[0]._id, lastMessageAt: daysAgo(0.3) },
  ]);
  await models.MailboxMessage.insertMany([
    { tenantId: tenant._id, threadId: threads[0]._id, accountId: emailAccount._id, providerMessageId: 'seed-msg-acme-1', direction: 'inbound', from: 'sarah.mitchell@acme-manufacturing.example', to: [emailAccount.email], subject: threads[0].subject, bodyText: 'Can you send over your RBAC and audit export documentation before legal review?', sentAt: daysAgo(0.5) },
    { tenantId: tenant._id, threadId: threads[0]._id, accountId: emailAccount._id, providerMessageId: 'seed-msg-acme-2', direction: 'outbound', from: emailAccount.email, to: ['sarah.mitchell@acme-manufacturing.example'], subject: threads[0].subject, bodyText: 'Attached is the requested documentation package. We can review it live tomorrow.', sentAt: daysAgo(0.4), createdBy: salesUser._id },
    { tenantId: tenant._id, threadId: threads[1]._id, accountId: emailAccount._id, providerMessageId: 'seed-msg-northstar-1', direction: 'inbound', from: 'rafael.ortega@northstar-clinics.example', to: [emailAccount.email], subject: threads[1].subject, bodyText: 'Messages are still delayed by about twenty minutes.', sentAt: daysAgo(0.3) },
  ]);

  await models.MassmailCampaign.insertMany([
    { tenantId: tenant._id, name: '[Seed] Q3 CRM adoption nurture', status: 'completed', subject: 'How teams improve forecast accuracy with NexusCRM', bodyHtml: '<p>See how revenue teams improve visibility with CRM automation.</p>', accountId: emailAccount._id, recipientSource: 'contacts', recipientFilter: { lifecycleStage: ['prospect', 'qualified'] }, recipientEmails: contacts.map((c) => c.email), businessHoursOnly: true, sentCount: 312, totalCount: 340, openCount: 188, clickCount: 54, createdBy: marketingUser._id, startedAt: daysAgo(5), completedAt: daysAgo(5) },
    { tenantId: tenant._id, name: '[Seed] Renewal education sequence', status: 'scheduled', subject: 'Get more from your NexusCRM renewal', bodyHtml: '<p>Learn about automation, security, and service workflows before renewal.</p>', accountId: emailAccount._id, recipientSource: 'companies', scheduledAt: daysFromNow(3), totalCount: 58, createdBy: marketingUser._id },
  ]);
  await models.SmsCampaign.create({ tenantId: tenant._id, name: '[Seed] Webinar reminder SMS', message: 'Reminder: NexusCRM workflow automation webinar starts tomorrow at 10 AM.', status: 'scheduled', recipientCount: 82, deliveredCount: 0, scheduledAt: daysFromNow(1), createdBy: marketingUser._id, customFields: { seed: true, audience: 'webinar_registrants' } });

  await models.KnowledgeArticle.insertMany([
    { tenantId: tenant._id, title: '[Seed] Troubleshooting shared inbox sync', category: 'inbox', content: 'Validate provider, OAuth token, IMAP host, folder mapping, and sync job logs. Escalate if messages lag beyond SLA.', status: 'published', createdBy: supportUser._id, customFields: { seed: true } },
    { tenantId: tenant._id, title: '[Seed] How to configure sales pipelines', category: 'sales', content: 'Use pipeline settings to define stages, probabilities, exit criteria, and required fields for deal governance.', status: 'published', createdBy: salesUser._id, customFields: { seed: true } },
  ]);
  await models.LiveChatSession.insertMany([
    { tenantId: tenant._id, visitorName: 'Elena Visitor', visitorEmail: 'elena.visitor@example.test', status: 'waiting', assignedTo: supportUser._id, lastMessage: 'Can someone help me understand pricing limits?', lastMessageAt: daysAgo(0.05), createdBy: supportUser._id, customFields: { seed: true, page: '/pricing' } },
    { tenantId: tenant._id, visitorName: 'Morgan Prospect', visitorEmail: 'morgan.prospect@example.test', status: 'closed', assignedTo: salesUser._id, lastMessage: 'Thanks, I booked a demo for next week.', lastMessageAt: daysAgo(3), createdBy: salesUser._id, customFields: { seed: true, page: '/contact' } },
  ]);

  const automationRule = await models.AutomationRule.create({ tenantId: tenant._id, name: '[Seed] Notify owner for high-value leads', description: 'When a high-value SQL is created, notify sales and create a task.', trigger: 'lead_created', triggerConfig: { source: 'website' }, action: 'notify', conditions: [{ field: 'value', operator: 'greater_than', value: 50000 }, { field: 'qualificationStage', operator: 'equals', value: 'sql' }], conditionMode: 'all', actions: [{ type: 'notify', name: 'Alert owner', config: { title: 'High-value lead', recipients: ['owner'] } }, { type: 'create_task', name: 'Follow-up task', config: { title: 'Call high-value lead within 1 hour' } }], retryPolicy: { maxAttempts: 3, delayMinutes: 10 }, version: 1, publishedAt: daysAgo(7), status: 'active', lastRunAt: daysAgo(1), lastRunStatus: 'succeeded', runCount: 12, createdBy: owner._id, customFields: { seed: true } });
  await models.AutomationRun.insertMany([
    { tenantId: tenant._id, ruleId: automationRule._id, triggeredBy: salesUser._id, trigger: 'lead_created', action: 'notify', status: 'succeeded', eventId: 'seed-event-high-value-lead', idempotencyKey: 'seed-high-value-lead-1', attempt: 1, maxAttempts: 3, input: { leadId: leads[0]._id, value: leads[0].value }, output: { notifications: 1, tasks: 1 }, actionResults: [{ type: 'notify', status: 'succeeded' }, { type: 'create_task', status: 'succeeded' }], logs: [{ level: 'info', message: 'Seed automation executed successfully.', at: daysAgo(1) }], queuedAt: daysAgo(1), startedAt: daysAgo(1), finishedAt: daysAgo(1), durationMs: 482 },
    { tenantId: tenant._id, ruleId: automationRule._id, triggeredBy: marketingUser._id, trigger: 'manual', action: 'notify', status: 'retry_scheduled', eventId: 'seed-event-retry-demo', idempotencyKey: 'seed-retry-demo-1', attempt: 2, maxAttempts: 3, input: { reason: 'webhook timeout demo' }, error: 'Webhook endpoint timed out', logs: [{ level: 'warning', message: 'Webhook timed out; retry scheduled.', at: daysAgo(0.5) }], queuedAt: daysAgo(0.5), nextRetryAt: daysFromNow(0.1) },
  ]);

  const sourceAsset = await createStorageAsset(tenant, owner, 'seed-import-leads.csv', 'firstName,lastName,email\nPriya,Nair,priya.nair@helio-retail.example\n', 'import', 'DataJob');
  const reportAsset = await createStorageAsset(tenant, owner, 'seed-sales-report.txt', 'Seed sales report export placeholder.\n', 'report_export', 'ReportExportJob');
  await models.DataJob.insertMany([
    { tenantId: tenant._id, type: 'import', status: 'completed', objectType: 'leads', name: 'Seed lead import - trade show list', source: 'seed', totalRows: 125, processedRows: 125, successRows: 118, failedRows: 7, progress: 100, fileName: 'trade-show-leads.csv', sourceFileId: sourceAsset._id, previewRows: [{ firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@helio-retail.example' }], logs: [{ level: 'info', message: 'Seed import completed with sample validation warnings.' }], requestedBy: owner._id, startedAt: daysAgo(2), finishedAt: daysAgo(2), committedRecordIds: leads.map((l) => l._id) },
    { tenantId: tenant._id, type: 'export', status: 'queued', objectType: 'deals', name: 'Seed open pipeline export', source: 'seed', totalRows: 3, progress: 0, requestedBy: salesUser._id, logs: [{ level: 'info', message: 'Waiting for worker lease.' }] },
  ]);
  await models.ReportExportJob.create({ tenantId: tenant._id, title: '[Seed] Sales leadership weekly export', reportType: 'sales', format: 'xlsx', status: 'completed', filters: { period: 'quarter_to_date', owner: salesUser._id }, columns: ['company', 'deal', 'stage', 'amount', 'closeDate'], progress: 100, rowCount: 42, fileName: 'seed-sales-leadership.xlsx', fileUrl: `/api/files/${reportAsset._id}/download`, fileMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: reportAsset.size, expiresAt: daysFromNow(14), requestedBy: salesUser._id, assignedTo: salesUser._id, createdBy: salesUser._id, startedAt: daysAgo(1), finishedAt: daysAgo(1), durationMs: 1800 });

  await models.CustomField.insertMany([
    { tenantId: tenant._id, objectType: 'Lead', key: 'seed_buying_committee', label: 'Buying Committee', type: 'select', description: 'Seed field showing buying committee maturity.', options: [{ label: 'Unknown', value: 'unknown', order: 1 }, { label: 'Mapped', value: 'mapped', order: 2 }, { label: 'Executive sponsor', value: 'executive_sponsor', order: 3 }], defaultValue: 'unknown', searchable: true, filterable: true, section: 'Seed Qualification', order: 10, createdBy: owner._id, updatedBy: owner._id },
    { tenantId: tenant._id, objectType: 'Company', key: 'seed_renewal_risk', label: 'Renewal Risk', type: 'select', description: 'Seed field for customer 360 renewal risk.', options: [{ label: 'Low', value: 'low', color: 'green' }, { label: 'Medium', value: 'medium', color: 'yellow' }, { label: 'High', value: 'high', color: 'red' }], defaultValue: 'medium', searchable: true, filterable: true, section: 'Seed Account Health', order: 20, createdBy: owner._id, updatedBy: owner._id },
  ]);

  await models.ChatMessage.insertMany([
    { tenantId: tenant._id, entityType: 'Deal', entityId: deals[0]._id, userId: salesUser._id, userName: salesUser.name, body: '[Seed] Legal review is underway. Please add security docs to the deal before tomorrow.', readBy: [{ userId: salesUser._id, userName: salesUser.name, readAt: daysAgo(0.2) }] },
    { tenantId: tenant._id, entityType: 'Ticket', entityId: tickets[0]._id, userId: supportUser._id, userName: supportUser.name, body: '[Seed] OAuth token refreshed. Monitoring next sync cycle now.', readBy: [{ userId: supportUser._id, userName: supportUser.name, readAt: daysAgo(0.1) }] },
  ]);
  await models.Notification.insertMany([
    { tenantId: tenant._id, userId: owner._id, type: 'seed.trial', title: 'Seed notification: trial reminder', body: 'Demo notification for trial and billing alert testing.', href: '/settings/billing', entityType: 'Tenant', entityId: tenant._id, read: false },
    { tenantId: tenant._id, userId: salesUser._id, type: 'seed.deal', title: 'Seed notification: high-value deal', body: 'Acme global rollout moved to legal review.', href: `/crm/deals/${deals[0]._id}`, entityType: 'Deal', entityId: deals[0]._id, read: false },
    { tenantId: tenant._id, userId: supportUser._id, type: 'seed.ticket', title: 'Seed notification: SLA risk', body: 'Northstar inbox sync ticket is approaching SLA deadline.', href: `/service/tickets/${tickets[0]._id}`, entityType: 'Ticket', entityId: tickets[0]._id, read: false },
  ]);
  await models.ActivityEvent.insertMany([
    { tenantId: tenant._id, actorId: salesUser._id, actorName: salesUser.name, action: 'seed_created', source: 'seed', severity: 'info', entityType: 'Deal', entityId: deals[0]._id, entityName: deals[0].title, summary: 'Seeded enterprise opportunity for end-to-end CRM testing.', href: `/crm/deals/${deals[0]._id}`, visibility: 'internal', relatedEntities: [{ entityType: 'Company', entityId: companies[0]._id, label: companies[0].name }], metadata: { seed: true } },
    { tenantId: tenant._id, actorId: supportUser._id, actorName: supportUser.name, action: 'seed_created', source: 'seed', severity: 'medium', entityType: 'Ticket', entityId: tickets[0]._id, entityName: tickets[0].title, summary: 'Seeded SLA-risk support ticket for service desk testing.', href: `/service/tickets/${tickets[0]._id}`, visibility: 'internal', metadata: { seed: true } },
    { tenantId: tenant._id, actorId: marketingUser._id, actorName: marketingUser.name, action: 'seed_created', source: 'seed', severity: 'info', entityType: 'MassmailCampaign', entityId: threads[0]._id, entityName: 'Q3 CRM adoption nurture', summary: 'Seeded campaign and inbox activity for marketing testing.', href: '/massmail', visibility: 'internal', metadata: { seed: true } },
  ]);

  const summary = {
    users: seedUsers.length,
    departments: departments.length,
    companies: companies.length,
    contacts: contacts.length,
    leads: leads.length,
    leadRoutingRules: leadRoutingRules.length,
    requests: requests.length,
    products: products.length,
    deals: deals.length,
    projects: projects.length,
    tasks: tasks.length,
    tickets: tickets.length,
    queues: queues.length,
    emailThreads: threads.length,
    automationRules: 1,
    dataJobs: 2,
    reportExports: 1,
    files: 2,
  };

  console.log('Seed completed successfully.');
  console.table(summary);
  console.log('Seed users password: SeedUser@2026');
}

run()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
