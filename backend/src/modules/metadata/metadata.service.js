const { Injectable, BadRequestException, NotFoundException } = require('@nestjs/common');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const FIELD_TYPES_WITH_OPTIONS = new Set(['select', 'multiselect']);
const RESERVED_KEYS = new Set(['id', '_id', 'tenantId', 'createdAt', 'updatedAt', '__v']);

function slugKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function normalizeOptions(options = []) {
  return options
    .filter((option) => option?.label || option?.value)
    .map((option, index) => ({
      label: String(option.label || option.value).trim(),
      value: slugKey(option.value || option.label),
      color: option.color || null,
      order: option.order ?? index,
    }))
    .filter((option) => option.label && option.value);
}

@Injectable()
class MetadataService {
  customFieldModel;

  async listCustomFields(tenantId, query = {}) {
    const filter = { tenantId };
    if (query.objectType) filter.objectType = query.objectType;
    if (query.includeInactive !== 'true' && query.includeInactive !== '1') {
      filter.isActive = true;
    }
    const rows = await this.customFieldModel
      .find(filter)
      .sort({ objectType: 1, order: 1, label: 1 })
      .lean();
    return rows.map(leanId);
  }

  async createCustomField(tenantId, userId, body = {}) {
    const payload = this.prepareCustomFieldPayload(body, true);
    const doc = await this.customFieldModel.create({
      tenantId,
      ...payload,
      createdBy: userId,
      updatedBy: userId,
    });
    await this.recordMetadataActivity(tenantId, userId, 'created', doc.toObject());
    return leanId(doc.toObject());
  }

  async updateCustomField(tenantId, userId, id, body = {}) {
    const existing = await this.customFieldModel.findOne({ _id: id, tenantId });
    if (!existing) throw new NotFoundException('Custom field not found');

    const payload = this.prepareCustomFieldPayload(body, false);
    Object.assign(existing, payload, { updatedBy: userId });
    await existing.save();
    await this.recordMetadataActivity(tenantId, userId, 'updated', existing.toObject(), { changes: payload });
    return leanId(existing.toObject());
  }

  async removeCustomField(tenantId, userId, id) {
    const field = await this.customFieldModel.findOne({ _id: id, tenantId });
    if (!field) throw new NotFoundException('Custom field not found');
    field.isActive = false;
    field.updatedBy = userId;
    await field.save();
    await this.recordMetadataActivity(tenantId, userId, 'disabled', field.toObject());
    return { id, disabled: true };
  }

  prepareCustomFieldPayload(body, isCreate) {
    const objectType = body.objectType?.trim();
    const label = body.label?.trim();
    const key = slugKey(body.key || label);

    if (isCreate && !objectType) throw new BadRequestException('objectType is required');
    if (isCreate && !label) throw new BadRequestException('label is required');
    if (isCreate && !key) throw new BadRequestException('key is required');
    if (RESERVED_KEYS.has(key)) throw new BadRequestException('This field key is reserved');

    const type = body.type || 'text';
    const options = normalizeOptions(body.options);
    if (FIELD_TYPES_WITH_OPTIONS.has(type) && options.length === 0) {
      throw new BadRequestException(`${type} fields require at least one option`);
    }

    const payload = {};
    if (objectType !== undefined) payload.objectType = objectType;
    if (key !== undefined) payload.key = key;
    if (label !== undefined) payload.label = label;
    if (type !== undefined) payload.type = type;
    if (body.description !== undefined) payload.description = body.description || '';
    if (body.placeholder !== undefined) payload.placeholder = body.placeholder || '';
    if (body.helpText !== undefined) payload.helpText = body.helpText || '';
    if (body.required !== undefined) payload.required = Boolean(body.required);
    if (body.searchable !== undefined) payload.searchable = Boolean(body.searchable);
    if (body.filterable !== undefined) payload.filterable = Boolean(body.filterable);
    if (body.unique !== undefined) payload.unique = Boolean(body.unique);
    if (body.options !== undefined) payload.options = options;
    if (body.defaultValue !== undefined) payload.defaultValue = body.defaultValue || null;
    if (body.validation !== undefined) payload.validation = body.validation || {};
    if (body.visibility !== undefined) payload.visibility = body.visibility || 'all';
    if (body.section !== undefined) payload.section = body.section || 'Custom fields';
    if (body.order !== undefined) payload.order = Number(body.order) || 0;
    if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);
    return payload;
  }

  async recordMetadataActivity(tenantId, userId, action, field, metadata = {}) {
    await recordActivityFromModel(this.customFieldModel, tenantId, userId, {
      action,
      entityType: 'CustomField',
      entityId: field._id,
      entityName: field.label,
      summary: `Custom field ${action}: ${field.objectType}.${field.key}`,
      href: '/settings/custom-fields',
      metadata,
    });
  }
}

module.exports = { MetadataService };
