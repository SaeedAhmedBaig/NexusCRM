const { Schema } = require('mongoose');

const REPORT_EXPORT_STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled'];
const REPORT_EXPORT_FORMATS = ['csv', 'xlsx', 'json'];
const REPORT_EXPORT_TYPES = ['analytics', 'sales', 'customers', 'team', 'activity', 'custom'];

const ReportExportJobSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    reportType: { type: String, enum: REPORT_EXPORT_TYPES, default: 'analytics', index: true },
    format: { type: String, enum: REPORT_EXPORT_FORMATS, default: 'xlsx' },
    status: { type: String, enum: REPORT_EXPORT_STATUSES, default: 'queued', index: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    columns: { type: [String], default: [] },
    progress: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileMimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    fileContent: { type: Buffer, default: null },
    expiresAt: { type: Date, default: null },
    error: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

ReportExportJobSchema.index({ tenantId: 1, createdAt: -1 });
ReportExportJobSchema.index({ tenantId: 1, status: 1, reportType: 1 });

module.exports = {
  ReportExportJobSchema,
  ReportExportJobModelName: 'ReportExportJob',
  REPORT_EXPORT_STATUSES,
  REPORT_EXPORT_FORMATS,
  REPORT_EXPORT_TYPES,
};
