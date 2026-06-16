const { Schema } = require('mongoose');

const TicketMacroSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    visibility: { type: String, enum: ['team', 'private'], default: 'team' },
    tags: { type: [String], default: [] },
    usageCount: { type: Number, default: 0 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

TicketMacroSchema.index({ tenantId: 1, status: 1, category: 1 });

module.exports = { TicketMacroSchema, TicketMacroModelName: 'TicketMacro' };
