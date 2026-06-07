const { Schema } = require('mongoose');

const AttachmentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

AttachmentSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });

module.exports = { AttachmentSchema, AttachmentModelName: 'Attachment' };
