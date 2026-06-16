const { Schema } = require('mongoose');

const CustomFieldOptionSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    color: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const CustomFieldSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    objectType: { type: String, required: true, index: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'currency', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'url', 'email', 'phone'],
      default: 'text',
    },
    description: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    required: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    filterable: { type: Boolean, default: true },
    unique: { type: Boolean, default: false },
    options: { type: [CustomFieldOptionSchema], default: [] },
    defaultValue: { type: Schema.Types.Mixed, default: null },
    validation: { type: Schema.Types.Mixed, default: {} },
    visibility: {
      type: String,
      enum: ['all', 'admins', 'owners'],
      default: 'all',
    },
    section: { type: String, default: 'Custom fields' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

CustomFieldSchema.index({ tenantId: 1, objectType: 1, key: 1 }, { unique: true });
CustomFieldSchema.index({ tenantId: 1, objectType: 1, isActive: 1, order: 1 });

module.exports = { CustomFieldSchema, CustomFieldModelName: 'CustomField' };
