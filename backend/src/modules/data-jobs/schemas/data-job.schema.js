const { Schema } = require('mongoose');

const DATA_JOB_STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled'];
const DATA_JOB_TYPES = ['import', 'export', 'report_export', 'sync', 'enrichment'];

const DataJobSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: DATA_JOB_TYPES, required: true, index: true },
    status: { type: String, enum: DATA_JOB_STATUSES, default: 'queued', index: true },
    objectType: { type: String, required: true, index: true },
    name: { type: String, required: true },
    source: { type: String, default: 'manual' },
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    successRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    resultUrl: { type: String, default: '' },
    errorUrl: { type: String, default: '' },
    mapping: { type: Schema.Types.Mixed, default: {} },
    options: { type: Schema.Types.Mixed, default: {} },
    errorRows: { type: [Schema.Types.Mixed], default: [] },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

DataJobSchema.index({ tenantId: 1, createdAt: -1 });
DataJobSchema.index({ tenantId: 1, type: 1, status: 1 });

module.exports = { DataJobSchema, DataJobModelName: 'DataJob', DATA_JOB_STATUSES, DATA_JOB_TYPES };
