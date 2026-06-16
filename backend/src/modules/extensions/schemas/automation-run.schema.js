const { Schema } = require('mongoose');

const AUTOMATION_RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'skipped', 'retry_scheduled'];

const AutomationRunLogSchema = new Schema(
  {
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AutomationRunSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true, index: true },
    parentRunId: { type: Schema.Types.ObjectId, ref: 'AutomationRun', default: null },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    trigger: { type: String, required: true },
    action: { type: String, required: true },
    status: { type: String, enum: AUTOMATION_RUN_STATUSES, default: 'queued', index: true },
    eventId: { type: String, default: '', index: true },
    idempotencyKey: { type: String, default: '', index: true },
    attempt: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 1 },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed, default: {} },
    actionResults: { type: Schema.Types.Mixed, default: [] },
    error: { type: String, default: '' },
    skippedReason: { type: String, default: '' },
    logs: { type: [AutomationRunLogSchema], default: [] },
    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    nextRetryAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AutomationRunSchema.index({ tenantId: 1, createdAt: -1 });
AutomationRunSchema.index({ tenantId: 1, ruleId: 1, createdAt: -1 });
AutomationRunSchema.index({ tenantId: 1, idempotencyKey: 1 });

module.exports = { AutomationRunSchema, AutomationRunModelName: 'AutomationRun', AUTOMATION_RUN_STATUSES };
