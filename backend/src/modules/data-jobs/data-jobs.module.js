const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { withModels } = require('../../common/providers/with-models');
const { RbacModule } = require('../rbac/rbac.module');
const { DataJobsController } = require('./data-jobs.controller');
const { DataJobsService } = require('./data-jobs.service');
const { DataJobSchema, DataJobModelName } = require('./schemas/data-job.schema');
const { FileAssetSchema, FileAssetModelName } = require('../files/schemas/file-asset.schema');
const { LeadSchema, LeadModelName } = require('../crm/schemas/lead.schema');
const { ContactSchema, ContactModelName } = require('../crm/schemas/contact.schema');
const { CompanySchema, CompanyModelName } = require('../crm/schemas/company.schema');
const { DealSchema, DealModelName } = require('../crm/schemas/deal.schema');
const { TicketSchema, TicketModelName } = require('../extensions/schemas/ticket.schema');
const { ProductSchema, ProductModelName } = require('../extensions/schemas/product.schema');
const { QuotationSchema, QuotationModelName } = require('../extensions/schemas/quotation.schema');
const { OrderSchema, OrderModelName } = require('../extensions/schemas/order.schema');
const { InvoiceSchema, InvoiceModelName } = require('../extensions/schemas/invoice.schema');
const { ActivityEventSchema, ActivityEventModelName } = require('../activity/schemas/activity-event.schema');

@Module({
  imports: [
    RbacModule,
    MongooseModule.forFeature([
      { name: DataJobModelName, schema: DataJobSchema },
      { name: FileAssetModelName, schema: FileAssetSchema },
      { name: LeadModelName, schema: LeadSchema },
      { name: ContactModelName, schema: ContactSchema },
      { name: CompanyModelName, schema: CompanySchema },
      { name: DealModelName, schema: DealSchema },
      { name: TicketModelName, schema: TicketSchema },
      { name: ProductModelName, schema: ProductSchema },
      { name: QuotationModelName, schema: QuotationSchema },
      { name: OrderModelName, schema: OrderSchema },
      { name: InvoiceModelName, schema: InvoiceSchema },
      { name: ActivityEventModelName, schema: ActivityEventSchema },
    ]),
  ],
  controllers: [DataJobsController],
  providers: [
    withModels(DataJobsService, {
      dataJobModel: DataJobModelName,
      fileAssetModel: FileAssetModelName,
      leadModel: LeadModelName,
      contactModel: ContactModelName,
      companyModel: CompanyModelName,
      dealModel: DealModelName,
      ticketModel: TicketModelName,
      productModel: ProductModelName,
      quotationModel: QuotationModelName,
      orderModel: OrderModelName,
      invoiceModel: InvoiceModelName,
      activityEventModel: ActivityEventModelName,
    }),
  ],
  exports: [DataJobsService],
})
class DataJobsModule {}

module.exports = { DataJobsModule };
