const { Schema } = require('mongoose');

const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sending', 'completed', 'failed'];

const MassmailCampaignSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft' },
    templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate', default: null },
    subject: { type: String, default: '' },
    bodyHtml: { type: String, default: '' },
    accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', default: null },
    recipientSource: { type: String, enum: ['contacts', 'companies', 'leads', 'manual'], default: 'contacts' },
    recipientFilter: { type: Schema.Types.Mixed, default: {} },
    recipientEmails: [{ type: String }],
    scheduledAt: { type: Date, default: null },
    businessHoursOnly: { type: Boolean, default: false },
    sentCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = { MassmailCampaignSchema, MassmailCampaignModelName: 'MassmailCampaign', CAMPAIGN_STATUSES };
