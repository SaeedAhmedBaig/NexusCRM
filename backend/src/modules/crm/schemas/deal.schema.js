const { Schema } = require('mongoose');

const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const DEAL_STATUSES = ['open', 'won', 'lost'];
const FORECAST_CATEGORIES = ['pipeline', 'best_case', 'commit', 'closed_won', 'closed_lost'];

const DealLineItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const DealSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: 'DealPipeline', default: null, index: true },
    stageKey: { type: String, default: 'lead', trim: true, index: true },
    stage: { type: String, enum: DEAL_STAGES, default: 'lead' },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    forecastCategory: { type: String, enum: FORECAST_CATEGORIES, default: 'pipeline', index: true },
    status: { type: String, enum: DEAL_STATUSES, default: 'open' },
    value: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    lineItems: { type: [DealLineItemSchema], default: [] },
    closeDate: { type: Date, default: null },
    nextStep: { type: String, default: '' },
    nextStepDueAt: { type: Date, default: null },
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
DealSchema.index({ tenantId: 1, pipelineId: 1, stageKey: 1 });
DealSchema.index({ tenantId: 1, assignedTo: 1 });
DealSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = { DealSchema, DealModelName: 'Deal', DEAL_STAGES, DEAL_STATUSES, FORECAST_CATEGORIES };
