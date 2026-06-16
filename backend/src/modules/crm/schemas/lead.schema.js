const { Schema } = require('mongoose');

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
const LEAD_SOURCES = ['website', 'referral', 'cold_call', 'trade_show', 'partner', 'other'];

const LeadSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    source: { type: String, enum: LEAD_SOURCES, default: 'website' },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    value: { type: Number, default: 0 },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

LeadSchema.index({ tenantId: 1, status: 1 });

module.exports = { LeadSchema, LeadModelName: 'Lead', LEAD_STATUSES, LEAD_SOURCES };
