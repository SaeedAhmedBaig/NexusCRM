const { Schema } = require('mongoose');

const CONTACT_STATUSES = ['active', 'inactive', 'lead'];

const ContactSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    jobTitle: { type: String, default: '', trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    status: { type: String, enum: CONTACT_STATUSES, default: 'active' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

ContactSchema.index({ tenantId: 1, email: 1 });

module.exports = { ContactSchema, ContactModelName: 'Contact', CONTACT_STATUSES };
