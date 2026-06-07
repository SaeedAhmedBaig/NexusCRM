const { Schema } = require('mongoose');

const REQUEST_STATUSES = ['pending', 'approved', 'rejected'];
const REQUEST_SOURCES = ['internal', 'web_form'];

const RequestSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    source: { type: String, enum: REQUEST_SOURCES, default: 'internal' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    leadSourceId: { type: Schema.Types.ObjectId, ref: 'LeadSource', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    submitterName: { type: String, default: '' },
    submitterEmail: { type: String, default: '' },
    submitterPhone: { type: String, default: '' },
    formData: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    country: { type: String, default: null },
    city: { type: String, default: null },
  },
  { timestamps: true },
);

RequestSchema.index({ tenantId: 1, status: 1 });

module.exports = { RequestSchema, RequestModelName: 'Request', REQUEST_STATUSES, REQUEST_SOURCES };
