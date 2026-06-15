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
      const prepared = config.prepareCreate
        ? config.prepareCreate(body, { tenantId, userId })
        : body;
      const doc = await this.model.create({
        tenantId,
        createdBy: userId,
        assignedTo: prepared.assignedTo || userId,
        ...prepared,
      });
      return leanId(doc.toObject());
    }

    bulk(tenantId, userId, body) {
      return this.getListService().bulk(tenantId, userId, body);
    }

    findOne(tenantId, id, user) {
      return this.getListService().findOne(tenantId, id, user);
    }

    update(tenantId, userId, id, body) {
      const prepared = config.prepareUpdate
        ? config.prepareUpdate(body, { tenantId, userId })
        : body;
      return this.getListService().update(tenantId, userId, id, prepared);
    }

    remove(tenantId, userId, id) {
      return this.getListService().remove(tenantId, userId, id);
    }
  }

  return EntityService;
}

module.exports = { createEntityService };
