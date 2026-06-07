const { Schema } = require('mongoose');

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true },
);

DepartmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = { DepartmentSchema, DepartmentModelName: 'Department' };
