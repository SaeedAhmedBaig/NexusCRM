const { Schema } = require('mongoose');

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
const LEAD_SOURCES = ['website', 'referral', 'cold_call', 'trade_show', 'partner', 'other'];
const LEAD_QUALIFICATION_STAGES = ['raw', 'mql', 'sql', 'accepted', 'rejected', 'recycled'];
const LEAD_ROUTING_STATUSES = ['unrouted', 'routed', 'no_match', 'failed'];

const LeadScoreBreakdownSchema = new Schema(
  {
    fit: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    intent: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false },
);

const LeadSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    firstName: { type: String, default: '', trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    jobTitle: { type: String, default: '', trim: true },
    source: { type: String, enum: LEAD_SOURCES, default: 'website' },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    qualificationStage: { type: String, enum: LEAD_QUALIFICATION_STAGES, default: 'raw', index: true },
    score: { type: Number, min: 0, max: 100, default: 0 },
    scoreBreakdown: { type: LeadScoreBreakdownSchema, default: () => ({}) },
    routingStatus: { type: String, enum: LEAD_ROUTING_STATUSES, default: 'unrouted', index: true },
    routedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    convertedCompanyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    convertedContactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    convertedDealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    conversionNotes: { type: String, default: '' },
    duplicateCandidateIds: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
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
LeadSchema.index({ tenantId: 1, email: 1 });
LeadSchema.index({ tenantId: 1, phone: 1 });
LeadSchema.index({ tenantId: 1, routingStatus: 1, createdAt: -1 });

module.exports = {
  LeadSchema,
  LeadModelName: 'Lead',
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_QUALIFICATION_STAGES,
  LEAD_ROUTING_STATUSES,
};
