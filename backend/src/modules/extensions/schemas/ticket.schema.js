const { Schema } = require('mongoose');

const TICKET_STATUSES = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_CHANNELS = ['email', 'chat', 'phone', 'portal', 'web', 'internal'];

const TicketConversationAttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, default: '' },
  },
  { _id: false },
);

const TicketConversationEntrySchema = new Schema(
  {
    body: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, default: 'System' },
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' },
    direction: { type: String, enum: ['inbound', 'outbound', 'note'], default: 'outbound' },
    attachments: { type: [TicketConversationAttachmentSchema], default: [] },
  },
  { timestamps: true },
);

const TicketSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium' },
    channel: { type: String, enum: TICKET_CHANNELS, default: 'web', index: true },
    queueId: { type: Schema.Types.ObjectId, ref: 'TicketQueue', default: null, index: true },
    firstResponseDueAt: { type: Date, default: null },
    firstResponseAt: { type: Date, default: null },
    slaDueAt: { type: Date, default: null },
    lastCustomerReplyAt: { type: Date, default: null },
    lastAgentReplyAt: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false, index: true },
    firstResponseBreached: { type: Boolean, default: false },
    resolutionBreached: { type: Boolean, default: false },
    statusChangedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    escalationLevel: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    internalNotes: { type: String, default: '' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    conversation: { type: [TicketConversationEntrySchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

TicketSchema.index({ tenantId: 1, status: 1 });
TicketSchema.index({ tenantId: 1, queueId: 1, status: 1 });
TicketSchema.index({ tenantId: 1, slaDueAt: 1, status: 1 });

module.exports = { TicketSchema, TicketModelName: 'Ticket', TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CHANNELS };
