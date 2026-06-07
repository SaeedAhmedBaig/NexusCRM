const { Injectable } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');

@Injectable()
class CompaniesService {
  companyModel;

  getListService() {
    return new CrmListService(this.companyModel, {
      searchFields: ['name', 'industry', 'website', 'phone'],
      populate: [{ path: 'assignedTo', select: 'name email' }],
      formatRow: (row) => {
        const base = leanId(row);
        if (row.assignedTo?._id) {
          base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name };
        }
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
}

module.exports = { CompaniesService };
