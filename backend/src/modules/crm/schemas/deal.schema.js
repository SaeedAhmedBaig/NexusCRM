const { Schema } = require('mongoose');

const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const DEAL_STATUSES = ['open', 'won', 'lost'];

const DealSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    stage: { type: String, enum: DEAL_STAGES, default: 'lead' },
    status: { type: String, enum: DEAL_STATUSES, default: 'open' },
    value: { type: Number, default: 0 },
    closeDate: { type: Date, default: null },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
    description: { type: String, default: '' },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

DealSchema.index({ tenantId: 1, status: 1 });
DealSchema.index({ tenantId: 1, assignedTo: 1 });
DealSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = { DealSchema, DealModelName: 'Deal', DEAL_STAGES, DEAL_STATUSES };
