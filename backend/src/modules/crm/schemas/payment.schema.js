const { Schema } = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const PaymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paidAt: { type: Date, default: null },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

module.exports = { PaymentSchema, PaymentModelName: 'Payment', PAYMENT_STATUSES };
