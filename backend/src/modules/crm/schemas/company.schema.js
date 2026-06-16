const { Schema } = require('mongoose');

const COMPANY_STATUSES = ['active', 'inactive', 'prospect'];
const COMPANY_LIFECYCLE_STAGES = ['target', 'prospect', 'qualified', 'active_customer', 'at_risk', 'renewal', 'churned', 'reactivation'];
const COMPANY_HEALTH_STATUSES = ['unknown', 'healthy', 'neutral', 'at_risk', 'critical'];
const COMPANY_TIERS = ['standard', 'strategic', 'enterprise', 'vip'];

const AccountPlanSchema = new Schema(
  {
    goals: { type: String, default: '' },
    successCriteria: { type: String, default: '' },
    risks: { type: String, default: '' },
    nextSteps: { type: String, default: '' },
    stakeholders: { type: String, default: '' },
    renewalStrategy: { type: String, default: '' },
  },
  { _id: false },
);

const CommunicationPreferencesSchema = new Schema(
  {
    emailOptIn: { type: Boolean, default: true },
    smsOptIn: { type: Boolean, default: false },
    doNotContact: { type: Boolean, default: false },
    preferredChannel: { type: String, enum: ['email', 'phone', 'sms', 'chat', 'none'], default: 'email' },
    notes: { type: String, default: '' },
  },
  { _id: false },
);

const CompanySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    status: { type: String, enum: COMPANY_STATUSES, default: 'active' },
    lifecycleStage: { type: String, enum: COMPANY_LIFECYCLE_STAGES, default: 'prospect', index: true },
    healthScore: { type: Number, min: 0, max: 100, default: 50 },
    healthStatus: { type: String, enum: COMPANY_HEALTH_STATUSES, default: 'unknown', index: true },
    accountTier: { type: String, enum: COMPANY_TIERS, default: 'standard', index: true },
    renewalDate: { type: Date, default: null },
    ownerNotes: { type: String, default: '' },
    accountPlan: { type: AccountPlanSchema, default: () => ({}) },
    communicationPreferences: { type: CommunicationPreferencesSchema, default: () => ({}) },
    parentCompanyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

CompanySchema.index({ tenantId: 1, name: 1 });
CompanySchema.index({ tenantId: 1, lifecycleStage: 1, healthStatus: 1 });

module.exports = {
  CompanySchema,
  CompanyModelName: 'Company',
  COMPANY_STATUSES,
  COMPANY_LIFECYCLE_STAGES,
  COMPANY_HEALTH_STATUSES,
  COMPANY_TIERS,
};
