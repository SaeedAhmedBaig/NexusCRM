const { Schema } = require('mongoose');

const MailboxAttachmentSchema = new Schema(
  {
    fileAssetId: { type: Schema.Types.ObjectId, ref: 'FileAsset', default: null },
    filename: { type: String, default: '' },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const MailboxMessageSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    threadId: { type: Schema.Types.ObjectId, ref: 'MailboxThread', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true, index: true },
    providerMessageId: { type: String, required: true },
    direction: { type: String, enum: ['inbound', 'outbound', 'note'], default: 'inbound' },
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' },
    from: { type: String, default: '' },
    to: { type: [String], default: [] },
    cc: { type: [String], default: [] },
    subject: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    bodyHtml: { type: String, default: '' },
    attachments: { type: [MailboxAttachmentSchema], default: [] },
    sentAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

MailboxMessageSchema.index({ tenantId: 1, accountId: 1, providerMessageId: 1 }, { unique: true });
MailboxMessageSchema.index({ tenantId: 1, threadId: 1, sentAt: 1 });

module.exports = { MailboxMessageSchema, MailboxMessageModelName: 'MailboxMessage' };
