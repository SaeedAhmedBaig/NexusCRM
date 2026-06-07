const { Schema } = require('mongoose');

const FormFieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'email', 'tel', 'textarea', 'select'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
  },
  { _id: false },
);

const DEFAULT_FORM_FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: false },
  { key: 'message', label: 'Message', type: 'textarea', required: true },
];

const LeadSourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    embedToken: { type: String, unique: true, sparse: true, index: true },
    formFields: { type: [FormFieldSchema], default: () => DEFAULT_FORM_FIELDS },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

LeadSourceSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = {
  LeadSourceSchema,
  LeadSourceModelName: 'LeadSource',
  DEFAULT_FORM_FIELDS,
};
