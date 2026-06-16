const { Injectable } = require('@nestjs/common');
const { leanId } = require('../crm/crm-query.helper');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
class ActivityService {
  activityEventModel;

  async record(tenantId, actorId, event = {}) {
    if (!tenantId || !event.entityType || !event.entityId || !event.action) return null;

    const summary = event.summary || `${event.entityType} ${event.action}`;
    const doc = await this.activityEventModel.create({
      tenantId,
      actorId: actorId || null,
      actorName: event.actorName || 'System',
      action: event.action,
      source: event.source || 'app',
      entityType: event.entityType,
      entityId: event.entityId,
      entityName: event.entityName || null,
      summary,
      href: event.href || null,
      visibility: event.visibility || 'internal',
      relatedEntities: event.relatedEntities || [],
      metadata: event.metadata || {},
    });

    return leanId(doc.toObject());
  }

  async list(tenantId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { tenantId };

    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.actorId) filter.actorId = query.actorId;
    if (query.action) filter.action = query.action;
    if (query.source) filter.source = query.source;
    if (query.visibility) filter.visibility = query.visibility;
    if (query.relatedEntityType || query.relatedEntityId) {
      filter.relatedEntities = {
        $elemMatch: {
          ...(query.relatedEntityType ? { entityType: query.relatedEntityType } : {}),
          ...(query.relatedEntityId ? { entityId: query.relatedEntityId } : {}),
        },
      };
    }
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ summary: regex }, { entityName: regex }, { actorName: regex }];
    }

    const [rows, total] = await Promise.all([
      this.activityEventModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.activityEventModel.countDocuments(filter),
    ]);

    return {
      data: rows.map(leanId),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  listForEntity(tenantId, entityType, entityId, query = {}) {
    return this.list(tenantId, { ...query, entityType, entityId });
  }
}

module.exports = { ActivityService };
