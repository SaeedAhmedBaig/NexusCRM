const { Injectable, NotFoundException } = require('@nestjs/common');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { emitChatMessage } = require('../../realtime/socket-hub');
const { NotificationsService } = require('./notifications.service');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'chat');

function leanId(doc) {
  if (!doc) return doc;
  const out = { ...doc, id: doc._id?.toString() };
  delete out._id;
  delete out.__v;
  return out;
}

function formatMessage(row) {
  const base = leanId(row);
  base.userId = row.userId?.toString?.() || row.userId;
  base.entityId = row.entityId?.toString?.() || row.entityId;
  base.attachments = (row.attachments || []).map((a) => ({
    id: a._id?.toString(),
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    url: a.url,
  }));
  return base;
}

@Injectable()
class ChatService {
  chatMessageModel;
  userModel;
  notificationsService;

  constructor() {
    this.notificationsService = null;
  }

  ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async listMessages(tenantId, { entityType, objectId, limit = 50 }) {
    const rows = await this.chatMessageModel
      .find({ tenantId, entityType, entityId: objectId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();
    return rows.reverse().map(formatMessage);
  }

  async createMessage(tenantId, userId, body) {
    const user = await this.userModel.findById(userId).lean();
    const userName = user?.name || 'User';

    const attachments = [];
    if (body.attachments?.length) {
      this.ensureUploadDir();
      for (const file of body.attachments) {
        const saved = await this.saveAttachment(file);
        if (saved) attachments.push(saved);
      }
    }

    const msg = await this.chatMessageModel.create({
      tenantId,
      entityType: body.entityType,
      entityId: body.objectId || body.entityId,
      userId,
      userName,
      body: body.body || '',
      attachments,
    });

    const formatted = formatMessage(msg.toObject());
    emitChatMessage(tenantId, body.entityType, String(body.objectId || body.entityId), formatted);
    return formatted;
  }

  async saveAttachment(file) {
    if (!file?.filename || !file?.data) return null;
    const id = crypto.randomBytes(12).toString('hex');
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageName = `${id}-${safeName}`;
    const storagePath = path.join(UPLOAD_DIR, storageName);
    const buffer = Buffer.from(file.data, 'base64');
    fs.writeFileSync(storagePath, buffer);
    return {
      filename: file.filename,
      mimeType: file.mimeType || 'application/octet-stream',
      size: buffer.length,
      url: `/api/chat/attachments/${id}/download`,
      storagePath: storageName,
    };
  }

  async getAttachment(tenantId, id) {
    this.ensureUploadDir();
    const files = fs.readdirSync(UPLOAD_DIR).filter((f) => f.startsWith(`${id}-`));
    if (!files.length) throw new NotFoundException('Attachment not found');
    const storagePath = path.join(UPLOAD_DIR, files[0]);
    const msg = await this.chatMessageModel
      .findOne({ tenantId, 'attachments.url': `/api/chat/attachments/${id}/download` })
      .lean();
    const att = msg?.attachments?.find((a) => a.url === `/api/chat/attachments/${id}/download`);
    return {
      path: storagePath,
      filename: att?.filename || files[0],
      mimeType: att?.mimeType || 'application/octet-stream',
    };
  }

  buildHref(entityType, entityId) {
    const map = {
      Deal: `/crm/deals/${entityId}`,
      Request: `/crm/requests`,
      Task: `/tasks`,
      Project: `/projects/${entityId}`,
    };
    return map[entityType] || '/dashboard';
  }
}

module.exports = { ChatService };
