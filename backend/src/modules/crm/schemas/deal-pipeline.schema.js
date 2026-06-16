const { Schema } = require('mongoose');

const PipelineStageSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    order: { type: Number, default: 0 },
    isWon: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false },
    requiredFields: [{ type: String, trim: true }],
    exitCriteria: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const DealPipelineSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isDefault: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    stages: { type: [PipelineStageSchema], default: [] },
  },
  { timestamps: true },
);

DealPipelineSchema.index({ tenantId: 1, isDefault: 1 });
DealPipelineSchema.index({ tenantId: 1, active: 1 });

module.exports = { DealPipelineSchema, DealPipelineModelName: 'DealPipeline' };
