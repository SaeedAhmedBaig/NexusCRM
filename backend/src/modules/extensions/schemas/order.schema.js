const { Schema } = require('mongoose');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const OrderLineItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
);

const OrderSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    orderNumber: { type: String, trim: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    lineItems: { type: [OrderLineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    terms: { type: String, default: '' },
    notes: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    pdfGeneratedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    sourceQuotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null },
    convertedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

OrderSchema.index({ tenantId: 1, status: 1 });

module.exports = { OrderSchema, OrderModelName: 'Order', ORDER_STATUSES };
