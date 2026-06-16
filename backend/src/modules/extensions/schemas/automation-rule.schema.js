const { Schema } = require('mongoose');

const AUTOMATION_STATUSES = ['active', 'inactive'];
const AUTOMATION_TRIGGERS = ['lead_created', 'deal_stage_changed', 'ticket_created', 'form_submitted', 'manual'];

const AutomationRuleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    trigger: { type: String, enum: AUTOMATION_TRIGGERS, default: 'manual' },
    action: { type: String, default: 'notify' },
    status: { type: String, enum: AUTOMATION_STATUSES, default: 'inactive' },
    config: { type: Schema.Types.Mixed, default: {} },
    lastRunAt: { type: Date, default: null },
    lastRunStatus: { type: String, default: '' },
    runCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

AutomationRuleSchema.index({ tenantId: 1, status: 1 });

module.exports = {
  AutomationRuleSchema,
  AutomationRuleModelName: 'AutomationRule',
  AUTOMATION_STATUSES,
  AUTOMATION_TRIGGERS,
};
