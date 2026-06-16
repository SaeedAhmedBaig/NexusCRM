const { Schema } = require('mongoose');

const FILE_ASSET_STATUSES = ['active', 'deleted', 'expired'];

const FileAssetSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    storageProvider: { type: String, default: 'local' },
    storageKey: { type: String, required: true },
    entityType: { type: String, default: 'FileAsset', index: true },
    entityId: { type: Schema.Types.ObjectId, default: null, index: true },
    purpose: { type: String, default: 'general', index: true },
    checksum: { type: String, default: '' },
    status: { type: String, enum: FILE_ASSET_STATUSES, default: 'active', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

FileAssetSchema.index({ tenantId: 1, purpose: 1, createdAt: -1 });
FileAssetSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });

module.exports = { FileAssetSchema, FileAssetModelName: 'FileAsset', FILE_ASSET_STATUSES };
