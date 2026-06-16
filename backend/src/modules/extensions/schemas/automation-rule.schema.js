const { Schema } = require('mongoose');

const AUTOMATION_STATUSES = ['active', 'inactive'];
const AUTOMATION_TRIGGERS = ['lead_created', 'deal_stage_changed', 'ticket_created', 'form_submitted', 'manual'];
const AUTOMATION_ACTIONS = ['notify', 'create_task', 'create_ticket', 'update_record', 'assign_owner', 'add_tag', 'send_email', 'send_sms', 'apply_ticket_macro', 'call_webhook'];

const AutomationConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists'], default: 'equals' },
    value: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const AutomationActionSchema = new Schema(
  {
    type: { type: String, enum: AUTOMATION_ACTIONS, default: 'notify' },
    name: { type: String, default: '' },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const AutomationRuleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    trigger: { type: String, enum: AUTOMATION_TRIGGERS, default: 'manual' },
    triggerConfig: { type: Schema.Types.Mixed, default: {} },
    action: { type: String, default: 'notify' },
    conditions: { type: [AutomationConditionSchema], default: [] },
    conditionMode: { type: String, enum: ['all', 'any'], default: 'all' },
    actions: { type: [AutomationActionSchema], default: [] },
    retryPolicy: {
      maxAttempts: { type: Number, default: 3 },
      delayMinutes: { type: Number, default: 5 },
    },
    version: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
    status: { type: String, enum: AUTOMATION_STATUSES, default: 'inactive' },
    config: { type: Schema.Types.Mixed, default: {} },
    lastRunAt: { type: Date, default: null },
    lastRunStatus: { type: String, default: '' },
    runCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

AutomationRuleSchema.index({ tenantId: 1, status: 1 });

module.exports = {
  AutomationRuleSchema,
  AutomationRuleModelName: 'AutomationRule',
  AUTOMATION_STATUSES,
  AUTOMATION_TRIGGERS,
  AUTOMATION_ACTIONS,
};
