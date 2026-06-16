const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { DealSchema, DealModelName } = require('./schemas/deal.schema');
const { RequestSchema, RequestModelName } = require('./schemas/request.schema');
const { CompanySchema, CompanyModelName } = require('./schemas/company.schema');
const { ContactSchema, ContactModelName } = require('./schemas/contact.schema');
const { LeadSchema, LeadModelName } = require('./schemas/lead.schema');
const { PaymentSchema, PaymentModelName } = require('./schemas/payment.schema');
const { CrmEmailSchema, CrmEmailModelName } = require('./schemas/crm-email.schema');
const { AttachmentSchema, AttachmentModelName } = require('./schemas/attachment.schema');
const { AuditLogSchema, AuditLogModelName } = require('./schemas/audit-log.schema');
const { TenantSchema, TenantModelName } = require('../tenant/schemas/tenant.schema');
const { UserSchema, UserModelName } = require('../auth/schemas/user.schema');
const { TicketSchema, TicketModelName } = require('../extensions/schemas/ticket.schema');
const { InvoiceSchema, InvoiceModelName } = require('../extensions/schemas/invoice.schema');
const { OrderSchema, OrderModelName } = require('../extensions/schemas/order.schema');
const { QuotationSchema, QuotationModelName } = require('../extensions/schemas/quotation.schema');
const { ActivityEventSchema, ActivityEventModelName } = require('../activity/schemas/activity-event.schema');
const { DealsService } = require('./deals.service');
const { DealsController } = require('./deals.controller');
const { CompaniesService } = require('./companies.service');
const { CompaniesController } = require('./companies.controller');
const { ContactsService } = require('./contacts.service');
const { LeadsService } = require('./leads.service');
const { RequestsService } = require('./requests.service');
const { CrmSeedService } = require('./crm-seed.service');
const { createCrmController } = require('./create-crm-controller');

const ContactsController = createCrmController('contacts', ContactsService);
const LeadsController = createCrmController('leads', LeadsService);
const RequestsController = createCrmController('requests', RequestsService);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealModelName, schema: DealSchema },
      { name: RequestModelName, schema: RequestSchema },
      { name: CompanyModelName, schema: CompanySchema },
      { name: ContactModelName, schema: ContactSchema },
      { name: LeadModelName, schema: LeadSchema },
      { name: PaymentModelName, schema: PaymentSchema },
      { name: CrmEmailModelName, schema: CrmEmailSchema },
      { name: AttachmentModelName, schema: AttachmentSchema },
      { name: AuditLogModelName, schema: AuditLogSchema },
      { name: TenantModelName, schema: TenantSchema },
      { name: UserModelName, schema: UserSchema },
      { name: TicketModelName, schema: TicketSchema },
      { name: InvoiceModelName, schema: InvoiceSchema },
      { name: OrderModelName, schema: OrderSchema },
      { name: QuotationModelName, schema: QuotationSchema },
      { name: ActivityEventModelName, schema: ActivityEventSchema },
    ]),
  ],
  controllers: [
    DealsController,
    CompaniesController,
    ContactsController,
    LeadsController,
    RequestsController,
  ],
  providers: [
    withModels(
      DealsService,
      {
        dealModel: 'Deal',
        paymentModel: 'Payment',
        crmEmailModel: 'CrmEmail',
        attachmentModel: 'Attachment',
        auditLogModel: 'AuditLog',
      },
      [{ token: CrmSeedService }],
    ),
    withModels(CompaniesService, {
      companyModel: 'Company',
      contactModel: 'Contact',
      dealModel: 'Deal',
      ticketModel: 'Ticket',
      invoiceModel: 'Invoice',
      orderModel: 'Order',
      quotationModel: 'Quotation',
      paymentModel: 'Payment',
      crmEmailModel: 'CrmEmail',
      attachmentModel: 'Attachment',
      activityEventModel: 'ActivityEvent',
    }),
    withModels(ContactsService, { contactModel: 'Contact' }),
    withModels(LeadsService, { leadModel: 'Lead' }),
    withModels(RequestsService, { requestModel: 'Request' }),
    withModels(CrmSeedService, {
      tenantModel: 'Tenant',
      companyModel: 'Company',
      contactModel: 'Contact',
      leadModel: 'Lead',
      dealModel: 'Deal',
      requestModel: 'Request',
      userModel: 'User',
    }),
  ],
  exports: [DealsService, CrmSeedService],
})
class CrmModule {}

module.exports = { CrmModule };
