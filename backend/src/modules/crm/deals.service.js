const { Injectable, NotFoundException } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const USER_POP = { path: 'assignedTo', select: 'name email' };
const COMPANY_POP = { path: 'companyId', select: 'name industry' };
const CONTACT_POP = { path: 'contactId', select: 'firstName lastName email' };
const PIPELINE_POP = { path: 'pipelineId', select: 'name stages isDefault' };

const DEFAULT_PIPELINE_STAGES = [
  { key: 'lead', label: 'Lead', probability: 10, order: 10, active: true },
  { key: 'qualified', label: 'Qualified', probability: 25, order: 20, active: true },
  { key: 'proposal', label: 'Proposal', probability: 50, order: 30, active: true },
  { key: 'negotiation', label: 'Negotiation', probability: 75, order: 40, active: true },
  { key: 'won', label: 'Won', probability: 100, order: 50, isWon: true, active: true },
  { key: 'lost', label: 'Lost', probability: 0, order: 60, isLost: true, active: true },
];

function normalizeStageKey(value) {
  return String(value || 'lead').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'lead';
}

function compatibleStage(stageKey, isWon, isLost) {
  if (isWon) return 'won';
  if (isLost) return 'lost';
  return ['lead', 'qualified', 'proposal', 'negotiation'].includes(stageKey) ? stageKey : 'lead';
}

function formatPipeline(row) {
  const base = leanId(row);
  base.stages = (row.stages || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((stage) => ({
      key: stage.key,
      id: stage.key,
      label: stage.label,
      probability: stage.probability || 0,
      order: stage.order || 0,
      isWon: Boolean(stage.isWon),
      isLost: Boolean(stage.isLost),
      requiredFields: stage.requiredFields || [],
      exitCriteria: stage.exitCriteria || '',
      active: stage.active !== false,
    }));
  return base;
}

function calculateLineItem(input = {}) {
  const quantity = Number(input.quantity) || 0;
  const unitPrice = Number(input.unitPrice) || 0;
  const discount = Number(input.discount) || 0;
  const taxRate = Number(input.taxRate) || 0;
  const net = Math.max(quantity * unitPrice - discount, 0);
  const tax = net * (taxRate / 100);
  return {
    ...input,
    quantity,
    unitPrice,
    discount,
    taxRate,
    total: Math.round((net + tax) * 100) / 100,
  };
}

@Injectable()
class DealsService {
  dealModel;
  dealPipelineModel;
  productModel;
  paymentModel;
  crmEmailModel;
  attachmentModel;
  auditLogModel;
  listService;
  crmSeedService;

  constructor(crmSeedService) {
    this.crmSeedService = crmSeedService;
    this.listService = null;
  }

  initListService() {
    if (!this.listService) {
      this.listService = new CrmListService(this.dealModel, {
        entityType: 'Deal',
        hrefBase: '/crm/deals',
        searchFields: ['title', 'description', 'stage', 'status'],
        populate: [USER_POP, COMPANY_POP, CONTACT_POP, PIPELINE_POP],
        formatRow: (row) => {
          const base = leanId(row);
          base.name = row.title;
          base.amount = row.value;
          base.stageKey = row.stageKey || row.stage;
          base.pipeline = row.pipelineId?._id ? { id: row.pipelineId._id.toString(), name: row.pipelineId.name } : null;
          if (row.assignedTo?._id) {
            base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name, email: row.assignedTo.email };
          }
          if (row.companyId?._id) {
            base.company = { id: row.companyId._id.toString(), name: row.companyId.name };
          }
          if (row.contactId?._id) {
            base.contact = {
              id: row.contactId._id.toString(),
              name: `${row.contactId.firstName || ''} ${row.contactId.lastName || ''}`.trim(),
            };
          }
          return base;
        },
      });
    }
    return this.listService;
  }

  async list(tenantId, query, user) {
    await this.ensureDefaultPipeline(tenantId);
    if (this.crmSeedService && user?.id) {
      this.crmSeedService.ensureCrmData(tenantId, user.id).catch(() => {});
    }
    return this.initListService().list(tenantId, query, user);
  }

  bulk(tenantId, userId, body) {
    return this.initListService().bulk(tenantId, userId, body);
  }

  async create(tenantId, userId, body) {
    const title = body.title || body.name;
    if (!title) throw new Error('Deal title is required');
    const pipeline = await this.getPipelineForDeal(tenantId, body.pipelineId);
    const stageKey = normalizeStageKey(body.stageKey || body.stage || pipeline.stages?.[0]?.key || 'lead');
    const stage = this.resolveStage(pipeline, stageKey);

    const doc = await this.dealModel.create({
      tenantId,
      title,
      value: body.value ?? body.amount ?? 0,
      pipelineId: pipeline._id,
      stageKey: stage.key,
      stage: compatibleStage(stage.key, stage.isWon, stage.isLost),
      probability: body.probability ?? stage.probability ?? 0,
      forecastCategory: body.forecastCategory || (stage.isWon ? 'closed_won' : stage.isLost ? 'closed_lost' : 'pipeline'),
      status: body.status || (stage.isWon ? 'won' : stage.isLost ? 'lost' : 'open'),
      closeDate: body.closeDate || null,
      nextStep: body.nextStep || '',
      nextStepDueAt: body.nextStepDueAt || null,
      companyId: body.companyId || null,
      contactId: body.contactId || null,
      departmentId: body.departmentId || null,
      assignedTo: body.assignedTo || userId,
      description: body.description || '',
      lineItems: (body.lineItems || []).map(calculateLineItem),
    });
    this.recalculateTotals(doc, body.value ?? body.amount);
    await doc.save();

    await this.logChange(tenantId, userId, doc._id.toString(), 'created', `Deal created: ${title}`);
    return this.findOne(tenantId, doc._id.toString());
  }

  async findOne(tenantId, id) {
    const deal = await this.dealModel
      .findOne({ _id: id, tenantId })
      .populate([USER_POP, COMPANY_POP, CONTACT_POP, PIPELINE_POP, { path: 'departmentId', select: 'name' }])
      .lean();

    if (!deal) throw new NotFoundException('Deal not found');

    const formatted = leanId(deal);
    formatted.name = deal.title;
    formatted.amount = deal.value;
    formatted.stageKey = deal.stageKey || deal.stage;
    formatted.pipeline = deal.pipelineId?._id ? { id: deal.pipelineId._id.toString(), name: deal.pipelineId.name } : null;
    if (deal.assignedTo) {
      formatted.owner = { id: deal.assignedTo._id.toString(), name: deal.assignedTo.name, email: deal.assignedTo.email };
    }
    if (deal.companyId) {
      formatted.company = { id: deal.companyId._id.toString(), name: deal.companyId.name, industry: deal.companyId.industry };
    }
    if (deal.contactId) {
      formatted.contact = {
        id: deal.contactId._id.toString(),
        name: `${deal.contactId.firstName} ${deal.contactId.lastName}`.trim(),
        email: deal.contactId.email,
      };
    }
    return formatted;
  }

  async update(tenantId, id, userId, body) {
    const deal = await this.dealModel.findOne({ _id: id, tenantId });
    if (!deal) throw new NotFoundException('Deal not found');

    const pipeline = await this.getPipelineForDeal(tenantId, body.pipelineId || deal.pipelineId);
    const allowed = ['title', 'status', 'value', 'closeDate', 'companyId', 'contactId', 'departmentId', 'assignedTo', 'description', 'probability', 'forecastCategory', 'nextStep', 'nextStepDueAt'];
    const changes = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        changes[key] = body[key];
        deal[key] = body[key];
      }
    }
    if (body.name) {
      deal.title = body.name;
      changes.title = body.name;
    }
    if (body.amount !== undefined) {
      deal.value = body.amount;
      changes.value = body.amount;
    }
    if (body.pipelineId !== undefined) {
      deal.pipelineId = pipeline._id;
      changes.pipelineId = pipeline._id;
    }
    if (body.stage !== undefined || body.stageKey !== undefined) {
      const stageKey = normalizeStageKey(body.stageKey || body.stage);
      const stage = this.resolveStage(pipeline, stageKey);
      deal.stageKey = stage.key;
      deal.stage = compatibleStage(stage.key, stage.isWon, stage.isLost);
      deal.probability = body.probability ?? stage.probability ?? deal.probability;
      deal.status = stage.isWon ? 'won' : stage.isLost ? 'lost' : 'open';
      deal.forecastCategory = stage.isWon ? 'closed_won' : stage.isLost ? 'closed_lost' : deal.forecastCategory;
      changes.stageKey = stage.key;
      changes.stage = deal.stage;
      changes.status = deal.status;
    }

    if (deal.status === 'won' && !deal.closedAt) deal.closedAt = new Date();
    if (deal.lineItems?.length && (body.amount === undefined && body.value === undefined)) this.recalculateTotals(deal);
    await deal.save();

    await this.logChange(tenantId, userId, id, 'updated', `Deal updated: ${deal.title}`, changes);
    return this.findOne(tenantId, id);
  }

  async getEmails(tenantId, id) {
    await this.assertExists(tenantId, id);
    const emails = await this.crmEmailModel.find({ tenantId, dealId: id }).sort({ sentAt: -1 }).lean();
    return emails.map(leanId);
  }

  async addPayment(tenantId, id, userId, body) {
    await this.assertExists(tenantId, id);
    const payment = await this.paymentModel.create({
      tenantId,
      dealId: id,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: body.status || 'pending',
      paidAt: body.paidAt ? new Date(body.paidAt) : null,
      note: body.note || '',
      createdBy: userId,
    });
    await this.logChange(tenantId, userId, id, 'payment_added', `Payment of $${body.amount} added`);
    return leanId(payment.toObject());
  }

  async getPayments(tenantId, id) {
    await this.assertExists(tenantId, id);
    const payments = await this.paymentModel.find({ tenantId, dealId: id }).sort({ createdAt: -1 }).lean();
    return payments.map(leanId);
  }

  async listPipelines(tenantId) {
    await this.ensureDefaultPipeline(tenantId);
    const rows = await this.dealPipelineModel.find({ tenantId }).sort({ isDefault: -1, createdAt: 1 }).lean();
    return rows.map(formatPipeline);
  }

  async createPipeline(tenantId, body = {}) {
    const stages = this.sanitizeStages(body.stages?.length ? body.stages : DEFAULT_PIPELINE_STAGES);
    if (body.isDefault) await this.dealPipelineModel.updateMany({ tenantId }, { $set: { isDefault: false } });
    const row = await this.dealPipelineModel.create({
      tenantId,
      name: body.name || 'Sales Pipeline',
      description: body.description || '',
      isDefault: Boolean(body.isDefault),
      active: body.active !== false,
      stages,
    });
    return formatPipeline(row.toObject());
  }

  async updatePipeline(tenantId, id, body = {}) {
    const payload = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.description !== undefined) payload.description = body.description;
    if (body.active !== undefined) payload.active = Boolean(body.active);
    if (body.stages !== undefined) payload.stages = this.sanitizeStages(body.stages);
    if (body.isDefault !== undefined) {
      payload.isDefault = Boolean(body.isDefault);
      if (payload.isDefault) await this.dealPipelineModel.updateMany({ tenantId, _id: { $ne: id } }, { $set: { isDefault: false } });
    }
    const row = await this.dealPipelineModel.findOneAndUpdate({ _id: id, tenantId }, { $set: payload }, { new: true, runValidators: true }).lean();
    if (!row) throw new NotFoundException('Pipeline not found');
    return formatPipeline(row);
  }

  async getLineItems(tenantId, id) {
    const deal = await this.assertExists(tenantId, id);
    return {
      items: (deal.lineItems || []).map(leanId),
      totals: this.formatTotals(deal),
    };
  }

  async addLineItem(tenantId, id, userId, body = {}) {
    const deal = await this.dealModel.findOne({ _id: id, tenantId });
    if (!deal) throw new NotFoundException('Deal not found');
    const item = await this.buildLineItem(tenantId, body);
    deal.lineItems.push(item);
    this.recalculateTotals(deal);
    await deal.save();
    await this.logChange(tenantId, userId, id, 'line_item_added', `Line item added: ${item.name}`, { item });
    return this.getLineItems(tenantId, id);
  }

  async updateLineItem(tenantId, id, lineItemId, userId, body = {}) {
    const deal = await this.dealModel.findOne({ _id: id, tenantId });
    if (!deal) throw new NotFoundException('Deal not found');
    const item = deal.lineItems.id(lineItemId);
    if (!item) throw new NotFoundException('Line item not found');
    const next = await this.buildLineItem(tenantId, { ...item.toObject(), ...body });
    Object.assign(item, next);
    this.recalculateTotals(deal);
    await deal.save();
    await this.logChange(tenantId, userId, id, 'line_item_updated', `Line item updated: ${item.name}`, { item: next });
    return this.getLineItems(tenantId, id);
  }

  async removeLineItem(tenantId, id, lineItemId, userId) {
    const deal = await this.dealModel.findOne({ _id: id, tenantId });
    if (!deal) throw new NotFoundException('Deal not found');
    const item = deal.lineItems.id(lineItemId);
    if (!item) throw new NotFoundException('Line item not found');
    const name = item.name;
    item.deleteOne();
    this.recalculateTotals(deal);
    await deal.save();
    await this.logChange(tenantId, userId, id, 'line_item_removed', `Line item removed: ${name}`);
    return this.getLineItems(tenantId, id);
  }

  async getAttachments(tenantId, id) {
    await this.assertExists(tenantId, id);
    const files = await this.attachmentModel.find({ tenantId, entityType: 'Deal', entityId: id }).sort({ createdAt: -1 }).lean();
    return files.map(leanId);
  }

  async getHistory(tenantId, id) {
    await this.assertExists(tenantId, id);
    const logs = await this.auditLogModel
      .find({ tenantId, entityType: 'Deal', entityId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return logs.map(leanId);
  }

  async sendEmail(tenantId, id, userId, body) {
    const deal = await this.assertExists(tenantId, id);
    const subject = body.subject || `[Ticket: ${id.toString().slice(-6)}] ${deal.title}`;
    const email = await this.crmEmailModel.create({
      tenantId,
      dealId: id,
      subject,
      body: body.body || '',
      to: body.to || '',
      from: body.from || '',
      direction: 'outbound',
      sentBy: userId,
      sentAt: new Date(),
    });
    return leanId(email.toObject());
  }

  async assertExists(tenantId, id) {
    const deal = await this.dealModel.findOne({ _id: id, tenantId }).lean();
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  sanitizeStages(stages = []) {
    const normalized = stages.map((stage, index) => ({
      key: normalizeStageKey(stage.key || stage.label),
      label: stage.label || stage.key || `Stage ${index + 1}`,
      probability: Math.max(0, Math.min(Number(stage.probability) || 0, 100)),
      order: Number(stage.order ?? (index + 1) * 10),
      isWon: Boolean(stage.isWon),
      isLost: Boolean(stage.isLost),
      requiredFields: Array.isArray(stage.requiredFields) ? stage.requiredFields.filter(Boolean) : [],
      exitCriteria: stage.exitCriteria || '',
      active: stage.active !== false,
    }));
    return normalized.length ? normalized : DEFAULT_PIPELINE_STAGES;
  }

  async ensureDefaultPipeline(tenantId) {
    let pipeline = await this.dealPipelineModel.findOne({ tenantId, isDefault: true }).lean();
    if (pipeline) return pipeline;
    pipeline = await this.dealPipelineModel.findOne({ tenantId }).lean();
    if (pipeline) return pipeline;
    return this.dealPipelineModel.create({
      tenantId,
      name: 'Default Sales Pipeline',
      description: 'Default opportunity stages for the workspace.',
      isDefault: true,
      active: true,
      stages: DEFAULT_PIPELINE_STAGES,
    });
  }

  async getPipelineForDeal(tenantId, pipelineId) {
    const pipeline = pipelineId
      ? await this.dealPipelineModel.findOne({ _id: pipelineId, tenantId }).lean()
      : await this.ensureDefaultPipeline(tenantId);
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  resolveStage(pipeline, stageKey) {
    const key = normalizeStageKey(stageKey);
    const stage = (pipeline.stages || []).find((item) => item.active !== false && item.key === key);
    if (!stage) throw new NotFoundException('Pipeline stage not found');
    return stage;
  }

  async buildLineItem(tenantId, body = {}) {
    let product = null;
    if (body.productId) {
      product = await this.productModel.findOne({ _id: body.productId, tenantId }).lean();
      if (!product) throw new NotFoundException('Product not found');
    }
    return calculateLineItem({
      productId: product?._id || body.productId || null,
      name: body.name || product?.name || 'Line item',
      sku: body.sku ?? product?.sku ?? '',
      quantity: body.quantity ?? 1,
      unitPrice: body.unitPrice ?? product?.unitPrice ?? 0,
      discount: body.discount ?? 0,
      taxRate: body.taxRate ?? 0,
      cost: body.cost ?? product?.cost ?? 0,
    });
  }

  recalculateTotals(deal, fallbackValue) {
    const items = deal.lineItems || [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const discountTotal = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
    const taxTotal = items.reduce((sum, item) => {
      const net = Math.max((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0), 0);
      return sum + net * ((Number(item.taxRate) || 0) / 100);
    }, 0);
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;
    deal.subtotal = Math.round(subtotal * 100) / 100;
    deal.discountTotal = Math.round(discountTotal * 100) / 100;
    deal.taxTotal = Math.round(taxTotal * 100) / 100;
    deal.grandTotal = grandTotal;
    if (items.length) deal.value = grandTotal;
    else if (fallbackValue !== undefined) deal.value = Number(fallbackValue) || 0;
  }

  formatTotals(deal) {
    return {
      subtotal: deal.subtotal || 0,
      discountTotal: deal.discountTotal || 0,
      taxTotal: deal.taxTotal || 0,
      grandTotal: deal.grandTotal || deal.value || 0,
      value: deal.value || 0,
    };
  }

  async logChange(tenantId, userId, entityId, action, summary, meta = {}) {
    const user = await this.dealModel.db.model('User').findById(userId).lean();
    await this.auditLogModel.create({
      tenantId,
      userId,
      userName: user?.name || 'User',
      action,
      entityType: 'Deal',
      entityId,
      summary,
      href: `/crm/deals/${entityId}`,
      meta,
    });
    await recordActivityFromModel(this.dealModel, tenantId, userId, {
      action,
      entityType: 'Deal',
      entityId,
      entityName: summary.replace(/^Deal (created|updated): /, ''),
      summary,
      href: `/crm/deals/${entityId}`,
      metadata: meta,
    });
  }
}

module.exports = { DealsService };
