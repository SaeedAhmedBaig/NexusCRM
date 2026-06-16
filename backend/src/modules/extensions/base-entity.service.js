const { Injectable } = require('@nestjs/common');
const { CrmListService } = require('../crm/crm-list.service');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel, getEntityName } = require('../activity/activity-recorder');

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
      const row = doc.toObject();
      await this.recordActivity(tenantId, userId, 'created', row);
      return leanId(row);
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

    async run(tenantId, userId, id, body = {}) {
      if (!config.run) throw new Error('Run is not supported for this entity');
      return config.run(this.model, { tenantId, userId, id, body });
    }

    async download(tenantId, id) {
      if (!config.download) throw new Error('Download is not supported for this entity');
      return config.download(this.model, { tenantId, id });
    }

    async recordActivity(tenantId, userId, action, record = {}, metadata = {}) {
      const entityType = config.entityType || this.model.modelName;
      const entityId = record._id || record.id;
      const entityName = getEntityName(record);
      const href = config.hrefBase && entityId ? `${config.hrefBase}/${entityId}` : null;
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

  return EntityService;
}

module.exports = { createEntityService };
