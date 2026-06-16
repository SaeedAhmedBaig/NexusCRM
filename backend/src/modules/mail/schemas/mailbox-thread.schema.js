const { Schema } = require('mongoose');

const MailboxThreadSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true, index: true },
    provider: { type: String, default: 'imap' },
    providerThreadId: { type: String, required: true },
    subject: { type: String, default: '' },
    participants: { type: [String], default: [] },
    preview: { type: String, default: '' },
    status: { type: String, enum: ['open', 'archived'], default: 'open', index: true },
    read: { type: Boolean, default: false, index: true },
    labels: { type: [String], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    linkedEntityType: { type: String, default: '' },
    linkedEntityId: { type: Schema.Types.ObjectId, default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

MailboxThreadSchema.index({ tenantId: 1, accountId: 1, providerThreadId: 1 }, { unique: true });
MailboxThreadSchema.index({ tenantId: 1, status: 1, lastMessageAt: -1 });

module.exports = { MailboxThreadSchema, MailboxThreadModelName: 'MailboxThread' };
