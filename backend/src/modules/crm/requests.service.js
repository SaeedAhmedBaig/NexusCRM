const { Injectable } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');

@Injectable()
class RequestsService {
  requestModel;

  getListService() {
    return new CrmListService(this.requestModel, {
      searchFields: ['title', 'description', 'status'],
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
      ],
      formatRow: (row) => {
        const base = leanId(row);
        base.name = row.title;
        if (row.assignedTo?._id) base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name };
        if (row.createdBy?._id) base.createdByUser = { id: row.createdBy._id.toString(), name: row.createdBy.name };
        return base;
      },
    });
  }

  list(tenantId, query, user) {
    return this.getListService().list(tenantId, query, user);
  }

  create(tenantId, userId, body) {
    return this.getListService().create(tenantId, userId, body);
  }

  bulk(tenantId, userId, body) {
    return this.getListService().bulk(tenantId, userId, body);
  }

  findOne(tenantId, id, user) {
    return this.getListService().findOne(tenantId, id, user);
  }

  update(tenantId, userId, id, body) {
    return this.getListService().update(tenantId, userId, id, body);
  }

  remove(tenantId, userId, id) {
    return this.getListService().remove(tenantId, userId, id);
  }
}

module.exports = { RequestsService };
