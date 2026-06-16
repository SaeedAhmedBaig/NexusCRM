const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { createEntityService } = require('./base-entity.service');
const { createEntityController } = require('./create-entity-controller');
const { ENTITY_CONFIGS } = require('./entity-configs');
const { QuotationSchema, QuotationModelName } = require('./schemas/quotation.schema');
const { OrderSchema, OrderModelName } = require('./schemas/order.schema');
const { InvoiceSchema, InvoiceModelName } = require('./schemas/invoice.schema');
const { ProductSchema, ProductModelName } = require('./schemas/product.schema');
const { TicketSchema, TicketModelName } = require('./schemas/ticket.schema');
const { TicketQueueSchema, TicketQueueModelName } = require('./schemas/ticket-queue.schema');
const { TicketMacroSchema, TicketMacroModelName } = require('./schemas/ticket-macro.schema');
const { SmsCampaignSchema, SmsCampaignModelName } = require('./schemas/sms-campaign.schema');
const { KnowledgeArticleSchema, KnowledgeArticleModelName } = require('./schemas/knowledge-article.schema');
const { AutomationRuleSchema, AutomationRuleModelName } = require('./schemas/automation-rule.schema');
const { AutomationRunSchema, AutomationRunModelName } = require('./schemas/automation-run.schema');
const { ReportExportJobSchema, ReportExportJobModelName } = require('./schemas/report-export-job.schema');
const { LiveChatSessionSchema, LiveChatSessionModelName } = require('./schemas/live-chat-session.schema');
const { EmailAccountSchema, EmailAccountModelName } = require('../mail/schemas/email-account.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { IntegrationsService } = require('./integrations.service');
const { IntegrationsController } = require('./integrations.controller');

const entities = [
  { route: 'quotations', modelName: QuotationModelName, configKey: 'quotations' },
  { route: 'orders', modelName: OrderModelName, configKey: 'orders' },
  { route: 'invoices', modelName: InvoiceModelName, configKey: 'invoices' },
  { route: 'products', modelName: ProductModelName, configKey: 'products' },
  { route: 'tickets', modelName: TicketModelName, configKey: 'tickets' },
  { route: 'ticket-queues', modelName: TicketQueueModelName, configKey: 'ticket-queues' },
  { route: 'ticket-macros', modelName: TicketMacroModelName, configKey: 'ticket-macros' },
  { route: 'sms', modelName: SmsCampaignModelName, configKey: 'sms' },
  { route: 'knowledge', modelName: KnowledgeArticleModelName, configKey: 'knowledge' },
  { route: 'automation', modelName: AutomationRuleModelName, configKey: 'automation' },
  { route: 'report-export-jobs', modelName: ReportExportJobModelName, configKey: 'report-export-jobs' },
  { route: 'live-chat', modelName: LiveChatSessionModelName, configKey: 'live-chat' },
];

const entityServices = entities.map(({ configKey }) => createEntityService(ENTITY_CONFIGS[configKey]));

const controllers = entities.map(({ route }, index) =>
  createEntityController(route, entityServices[index]),
);

const providers = entities.map(({ modelName }, index) =>
  withModels(entityServices[index], { model: modelName }),
);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuotationModelName, schema: QuotationSchema },
      { name: OrderModelName, schema: OrderSchema },
      { name: InvoiceModelName, schema: InvoiceSchema },
      { name: ProductModelName, schema: ProductSchema },
      { name: TicketModelName, schema: TicketSchema },
      { name: TicketQueueModelName, schema: TicketQueueSchema },
      { name: TicketMacroModelName, schema: TicketMacroSchema },
      { name: SmsCampaignModelName, schema: SmsCampaignSchema },
      { name: KnowledgeArticleModelName, schema: KnowledgeArticleSchema },
      { name: AutomationRuleModelName, schema: AutomationRuleSchema },
      { name: AutomationRunModelName, schema: AutomationRunSchema },
      { name: ReportExportJobModelName, schema: ReportExportJobSchema },
      { name: LiveChatSessionModelName, schema: LiveChatSessionSchema },
      { name: EmailAccountModelName, schema: EmailAccountSchema },
      { name: TenantModelName, schema: TenantSchema },
    ]),
  ],
  controllers: [...controllers, IntegrationsController],
  providers: [
    ...providers,
    withModels(IntegrationsService, {
      emailAccountModel: 'EmailAccount',
      tenantModel: 'Tenant',
    }),
  ],
})
class ExtensionsModule {}

module.exports = { ExtensionsModule };
