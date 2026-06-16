const { Schema } = require('mongoose');

const TicketQueueSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    defaultAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    slaPolicy: {
      firstResponseHours: { type: Number, default: 24 },
      resolutionHours: { type: Number, default: 72 },
      businessHoursOnly: { type: Boolean, default: false },
    },
    routingRules: { type: Schema.Types.Mixed, default: {} },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

TicketQueueSchema.index({ tenantId: 1, status: 1, priority: 1 });

module.exports = { TicketQueueSchema, TicketQueueModelName: 'TicketQueue' };
