const { Schema } = require('mongoose');

const LEAD_ROUTING_STRATEGIES = ['fixed_owner', 'department_round_robin', 'department_pool'];

const LeadRoutingCriteriaSchema = new Schema(
  {
    sources: [{ type: String, trim: true }],
    statuses: [{ type: String, trim: true }],
    qualificationStages: [{ type: String, trim: true }],
    minValue: { type: Number, default: null },
    maxValue: { type: Number, default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    keywords: [{ type: String, trim: true, lowercase: true }],
  },
  { _id: false },
);

const LeadRoutingRuleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: Number, default: 100, index: true },
    active: { type: Boolean, default: true, index: true },
    criteria: { type: LeadRoutingCriteriaSchema, default: () => ({}) },
    strategy: { type: String, enum: LEAD_ROUTING_STRATEGIES, default: 'fixed_owner' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    lastAssignedUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    runCount: { type: Number, default: 0 },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true },
);

LeadRoutingRuleSchema.index({ tenantId: 1, active: 1, priority: 1 });

module.exports = {
  LeadRoutingRuleSchema,
  LeadRoutingRuleModelName: 'LeadRoutingRule',
  LEAD_ROUTING_STRATEGIES,
};
