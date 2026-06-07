const { Schema } = require('mongoose');

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

const InvoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, trim: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'draft' },
    amount: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

InvoiceSchema.index({ tenantId: 1, status: 1 });

module.exports = { InvoiceSchema, InvoiceModelName: 'Invoice', INVOICE_STATUSES };
