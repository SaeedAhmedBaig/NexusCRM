const { Schema } = require('mongoose');

const COMPANY_STATUSES = ['active', 'inactive', 'prospect'];

const CompanySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    status: { type: String, enum: COMPANY_STATUSES, default: 'active' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

CompanySchema.index({ tenantId: 1, name: 1 });

module.exports = { CompanySchema, CompanyModelName: 'Company', COMPANY_STATUSES };
