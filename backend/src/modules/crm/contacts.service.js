const { Injectable } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');

@Injectable()
class ContactsService {
  contactModel;

  getListService() {
    return new CrmListService(this.contactModel, {
      entityType: 'Contact',
      hrefBase: '/crm/contacts',
      searchFields: ['firstName', 'lastName', 'email', 'phone', 'jobTitle'],
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'companyId', select: 'name' },
      ],
      formatRow: (row) => {
        const base = leanId(row);
        base.name = `${row.firstName || ''} ${row.lastName || ''}`.trim();
        if (row.companyId?._id) base.company = { id: row.companyId._id.toString(), name: row.companyId.name };
        if (row.assignedTo?._id) base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name };
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

module.exports = { ContactsService };
