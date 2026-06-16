const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const STORAGE_ROOT = path.resolve(process.env.LOCAL_FILE_STORAGE_DIR || path.join(process.cwd(), 'storage'));
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function safeName(name = 'file') {
  return String(name).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'file';
}

function bufferFromPayload(body = {}) {
  if (body.base64) return Buffer.from(body.base64, 'base64');
  if (body.content !== undefined) return Buffer.from(String(body.content), body.encoding || 'utf8');
  throw new BadRequestException('content or base64 is required');
}

@Injectable()
class FilesService {
  fileAssetModel;

  async list(tenantId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    const filter = { tenantId };
    if (query.purpose) filter.purpose = query.purpose;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.status) filter.status = query.status;
    const [rows, total] = await Promise.all([
      this.fileAssetModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.fileAssetModel.countDocuments(filter),
    ]);
    return { data: rows.map(leanId), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async createFromContent(tenantId, userId, body = {}) {
    const buffer = bufferFromPayload(body);
    if (buffer.length > MAX_FILE_BYTES) throw new BadRequestException('File exceeds 10MB limit');
    const originalName = safeName(body.filename || body.originalName || 'artifact.txt');
    const ext = path.extname(originalName);
    const id = crypto.randomUUID();
    const filename = `${id}${ext}`;
    const tenantFolder = path.join(STORAGE_ROOT, String(tenantId));
    await fs.mkdir(tenantFolder, { recursive: true });
    const storageKey = path.join(String(tenantId), filename);
    const absolutePath = path.join(STORAGE_ROOT, storageKey);
    await fs.writeFile(absolutePath, buffer);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const asset = await this.fileAssetModel.create({
      tenantId,
      filename,
      originalName,
      mimeType: body.mimeType || 'text/plain; charset=utf-8',
      size: buffer.length,
      storageKey,
      entityType: body.entityType || 'FileAsset',
      entityId: body.entityId || null,
      purpose: body.purpose || 'general',
      checksum,
      uploadedBy: userId,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      metadata: body.metadata || {},
    });
    await this.recordActivity(tenantId, userId, 'uploaded', asset.toObject());
    return leanId(asset.toObject());
  }

  async readFile(tenantId, id) {
    const asset = await this.fileAssetModel.findOne({ _id: id, tenantId, status: 'active' }).lean();
    if (!asset) throw new NotFoundException('File not found');
    const absolutePath = path.join(STORAGE_ROOT, asset.storageKey);
    const buffer = await fs.readFile(absolutePath);
    return {
      fileName: asset.originalName || asset.filename,
      mimeType: asset.mimeType || 'application/octet-stream',
      buffer,
      asset,
    };
  }

  async remove(tenantId, userId, id) {
    const asset = await this.fileAssetModel.findOne({ _id: id, tenantId });
    if (!asset) throw new NotFoundException('File not found');
    asset.status = 'deleted';
    await asset.save();
    await this.recordActivity(tenantId, userId, 'deleted', asset.toObject());
    return leanId(asset.toObject());
  }

  recordActivity(tenantId, userId, action, asset) {
    return recordActivityFromModel(this.fileAssetModel, tenantId, userId, {
      action,
      source: 'files',
      entityType: 'FileAsset',
      entityId: asset._id,
      entityName: asset.originalName,
      summary: `File ${action}: ${asset.originalName}`,
      href: `/api/files/${asset._id}/download`,
      metadata: { purpose: asset.purpose, mimeType: asset.mimeType, size: asset.size },
    });
  }
}

module.exports = { FilesService };
