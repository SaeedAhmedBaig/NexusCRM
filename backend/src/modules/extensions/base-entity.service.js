const { Injectable } = require('@nestjs/common');
const { CrmListService } = require('../crm/crm-list.service');
const { leanId } = require('../crm/crm-query.helper');

function createEntityService(config) {
  @Injectable()
  class EntityService {
    model;

    getListService() {
      return new CrmListService(this.model, config);
    }

    list(tenantId, query, user) {
      return this.getListService().list(tenantId, query, user);
    }

    async create(tenantId, userId, body) {
      const doc = await this.model.create({
        tenantId,
        createdBy: userId,
        ...body,
      });
      return leanId(doc.toObject());
    }

    bulk(tenantId, userId, body) {
      return this.getListService().bulk(tenantId, userId, body);
    }
  }

  return EntityService;
}

module.exports = { createEntityService };
