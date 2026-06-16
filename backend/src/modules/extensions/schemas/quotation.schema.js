const { Schema } = require('mongoose');

const QUOTATION_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

const QuoteLineItemSchema = new Schema(
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

const QuotationSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    number: { type: String, trim: true },
    status: { type: String, enum: QUOTATION_STATUSES, default: 'draft' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    lineItems: { type: [QuoteLineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    validUntil: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

QuotationSchema.index({ tenantId: 1, status: 1 });

module.exports = { QuotationSchema, QuotationModelName: 'Quotation', QUOTATION_STATUSES };
