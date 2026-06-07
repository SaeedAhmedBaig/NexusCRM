const { Injectable, NotFoundException } = require('@nestjs/common');
const { emitNotification } = require('../../realtime/socket-hub');

function leanId(doc) {
  if (!doc) return doc;
  const out = { ...doc, id: doc._id?.toString() };
  delete out._id;
  delete out.__v;
  return out;
}

@Injectable()
class NotificationsService {
  notificationModel;
  userTenantModel;

  async list(tenantId, userId, { unreadOnly, limit = 10 } = {}) {
    const filter = { tenantId, userId };
    if (unreadOnly === 'true' || unreadOnly === true) filter.read = false;

    const rows = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 10, 50))
      .lean();

    return rows.map(leanId);
  }

  async unreadCount(tenantId, userId) {
    return this.notificationModel.countDocuments({ tenantId, userId, read: false });
  }

  async create(tenantId, userId, payload) {
    const note = await this.notificationModel.create({
      tenantId,
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body || '',
      href: payload.href || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      read: false,
    });

    const formatted = leanId(note.toObject());
    emitNotification(tenantId, String(userId), formatted);
    return formatted;
  }

  async markRead(tenantId, userId, id) {
    const note = await this.notificationModel.findOneAndUpdate(
      { _id: id, tenantId, userId },
      { $set: { read: true } },
      { new: true },
    );
    if (!note) throw new NotFoundException('Notification not found');
    return leanId(note.toObject());
  }

  async notifyObjectParticipants({
    tenantId,
    excludeUserId,
    entityType,
    entityId,
    type,
    title,
    body,
    href,
  }) {
    const members = await this.userTenantModel.find({ tenantId, isActive: true }).lean();
    const tasks = members
      .filter((m) => String(m.userId) !== String(excludeUserId))
      .slice(0, 20)
      .map((m) =>
        this.create(tenantId, m.userId, {
          type,
          title,
          body,
          href,
          entityType,
          entityId,
        }),
      );
    await Promise.all(tasks);
  }
}

module.exports = { NotificationsService };
