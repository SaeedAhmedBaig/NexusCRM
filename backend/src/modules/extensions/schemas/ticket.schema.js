const { Schema } = require('mongoose');

const TICKET_STATUSES = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const TicketSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium' },
    firstResponseDueAt: { type: Date, default: null },
    slaDueAt: { type: Date, default: null },
    statusChangedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    escalationLevel: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    internalNotes: { type: String, default: '' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

TicketSchema.index({ tenantId: 1, status: 1 });

module.exports = { TicketSchema, TicketModelName: 'Ticket', TICKET_STATUSES, TICKET_PRIORITIES };
