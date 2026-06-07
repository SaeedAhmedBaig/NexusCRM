const { Schema } = require('mongoose');

const SMS_STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed'];

const SmsCampaignSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: SMS_STATUSES, default: 'draft' },
    recipientCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

SmsCampaignSchema.index({ tenantId: 1, status: 1 });

module.exports = { SmsCampaignSchema, SmsCampaignModelName: 'SmsCampaign', SMS_STATUSES };
