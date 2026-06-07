const { Schema } = require('mongoose');

const ChatAttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
  },
  { _id: true },
);

const ChatMessageSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: 'User' },
    body: { type: String, default: '' },
    attachments: [ChatAttachmentSchema],
  },
  { timestamps: true },
);

ChatMessageSchema.index({ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = { ChatMessageSchema, ChatMessageModelName: 'ChatMessage' };
