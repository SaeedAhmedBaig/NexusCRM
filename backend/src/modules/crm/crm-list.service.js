const { NotFoundException } = require('@nestjs/common');
const { parseListQuery, buildFilter, paginatedResponse, leanId } = require('./crm-query.helper');
const { applyDepartmentScope } = require('../../common/utils/department-scope');
const { recordActivityFromModel, getEntityName } = require('../activity/activity-recorder');

class CrmListService {
  constructor(model, config) {
    this.model = model;
    this.config = config;
  }

  async list(tenantId, query, user) {
    const { page, limit, skip, sort } = parseListQuery(query);
    let filter = buildFilter(tenantId, query, this.config);
    filter = applyDepartmentScope(filter, query, user);

    const [rows, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(this.config.populate || [])
        .lean(),
      this.model.countDocuments(filter),
    ]);

    const data = rows.map((row) => this.config.formatRow ? this.config.formatRow(row) : this.formatDefault(row));
    return paginatedResponse(data, total, page, limit);
  }

  formatDefault(row) {
    const base = leanId(row);
    if (row.assignedTo && typeof row.assignedTo === 'object') {
      base.owner = {
        id: row.assignedTo._id?.toString(),
        name: row.assignedTo.name,
        email: row.assignedTo.email,
      };
    }
    if (row.companyId && typeof row.companyId === 'object') {
      base.company = { id: row.companyId._id?.toString(), name: row.companyId.name };
    }
    if (row.contactId && typeof row.contactId === 'object') {
      base.contact = {
        id: row.contactId._id?.toString(),
        name: `${row.contactId.firstName || ''} ${row.contactId.lastName || ''}`.trim(),
      };
    }
    if (row.createdBy && typeof row.createdBy === 'object') {
      base.createdByUser = {
        id: row.createdBy._id?.toString(),
        name: row.createdBy.name,
      };
    }
    return base;
  }

  async create(tenantId, userId, body = {}) {
    const doc = await this.model.create({
      tenantId,
      assignedTo: body.assignedTo || userId,
      ...body,
    });
    const row = await this.model
      .findById(doc._id)
      .populate(this.config.populate || [])
      .lean();
    await this.recordActivity(tenantId, userId, 'created', row);
    return this.config.formatRow ? this.config.formatRow(row) : this.formatDefault(row);
  }

  async findOne(tenantId, id) {
    const row = await this.model
      .findOne({ _id: id, tenantId })
      .populate(this.config.populate || [])
      .lean();
    if (!row) throw new NotFoundException('Record not found');
    return this.config.formatRow ? this.config.formatRow(row) : this.formatDefault(row);
  }

  async update(tenantId, userId, id, body = {}) {
    const blocked = new Set(['_id', 'id', 'tenantId', 'createdAt', 'updatedAt', '__v']);
    const payload = Object.fromEntries(
      Object.entries(body).filter(([key]) => !blocked.has(key)),
    );

    const row = await this.model
      .findOneAndUpdate(
        { _id: id, tenantId },
        { $set: payload },
        { new: true, runValidators: true },
      )
      .populate(this.config.populate || [])
      .lean();
    if (!row) throw new NotFoundException('Record not found');
    await this.recordActivity(tenantId, userId, 'updated', row, { changes: payload });
    return this.config.formatRow ? this.config.formatRow(row) : this.formatDefault(row);
  }

  async remove(tenantId, userId, id) {
    const existing = await this.model.findOne({ _id: id, tenantId }).lean();
    const result = await this.model.deleteOne({ _id: id, tenantId });
    if (!result.deletedCount) throw new NotFoundException('Record not found');
    await this.recordActivity(tenantId, userId, 'deleted', existing || { _id: id });
    return { id, deleted: true };
  }

  async bulk(tenantId, userId, { action, ids = [], payload = {} }) {
    if (!ids.length) return { affected: 0 };

    const filter = { tenantId, _id: { $in: ids } };
    let affected = 0;

    switch (action) {
      case 'delete':
        ({ deletedCount: affected } = await this.model.deleteMany(filter));
        break;
      case 'change_status':
        if (!payload.status) throw new Error('status is required');
        ({ modifiedCount: affected } = await this.model.updateMany(filter, { $set: { status: payload.status } }));
        break;
      case 'assign_owner':
        if (!payload.assignedTo) throw new Error('assignedTo is required');
        ({ modifiedCount: affected } = await this.model.updateMany(filter, { $set: { assignedTo: payload.assignedTo } }));
        break;
      case 'mass_mail':
        affected = ids.length;
        break;
      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }

    return { action, affected, ids };
  }

  async recordActivity(tenantId, userId, action, record = {}, metadata = {}) {
    const entityType = this.config.entityType || this.model.modelName;
    const entityId = record._id || record.id;
    const entityName = getEntityName(record);
    const href = this.config.hrefBase && entityId ? `${this.config.hrefBase}/${entityId}` : null;
    const label = entityName ? `: ${entityName}` : '';

    await recordActivityFromModel(this.model, tenantId, userId, {
      action,
      entityType,
      entityId,
      entityName,
      record,
      href,
      summary: `${entityType} ${action}${label}`,
      metadata,
    });
  }
}

module.exports = { CrmListService };
