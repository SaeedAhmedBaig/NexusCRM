const { Schema } = require('mongoose');

const CrmEmailSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', default: null },
    subject: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

CrmEmailSchema.index({ tenantId: 1, dealId: 1 });

module.exports = { CrmEmailSchema, CrmEmailModelName: 'CrmEmail' };
