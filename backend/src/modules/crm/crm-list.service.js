const { parseListQuery, buildFilter, paginatedResponse, leanId } = require('./crm-query.helper');
const { applyDepartmentScope } = require('../../common/utils/department-scope');

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
    return this.config.formatRow ? this.config.formatRow(row) : this.formatDefault(row);
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
}

module.exports = { CrmListService };
