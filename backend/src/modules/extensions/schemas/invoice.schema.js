const { Schema } = require('mongoose');

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

const InvoiceLineItemSchema = new Schema(
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
  { _id: false },
);

const InvoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, trim: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'draft' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    lineItems: { type: [InvoiceLineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

InvoiceSchema.index({ tenantId: 1, status: 1 });

module.exports = { InvoiceSchema, InvoiceModelName: 'Invoice', INVOICE_STATUSES };
