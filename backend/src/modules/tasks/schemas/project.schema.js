const { Schema } = require('mongoose');

const PROJECT_STATUSES = ['active', 'completed', 'on_hold', 'archived'];

const ProjectSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: PROJECT_STATUSES, default: 'active' },
    color: { type: String, default: '#4f46e5' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

ProjectSchema.index({ tenantId: 1, name: 1 });

module.exports = { ProjectSchema, ProjectModelName: 'Project', PROJECT_STATUSES };
