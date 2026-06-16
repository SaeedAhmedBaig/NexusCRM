const { Schema } = require('mongoose');

const CHAT_SESSION_STATUSES = ['waiting', 'active', 'closed'];

const LiveChatSessionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    visitorName: { type: String, default: 'Visitor', trim: true },
    visitorEmail: { type: String, default: '', trim: true },
    status: { type: String, enum: CHAT_SESSION_STATUSES, default: 'waiting' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

LiveChatSessionSchema.index({ tenantId: 1, status: 1 });

module.exports = {
  LiveChatSessionSchema,
  LiveChatSessionModelName: 'LiveChatSession',
  CHAT_SESSION_STATUSES,
};
