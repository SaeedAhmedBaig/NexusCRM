const { Injectable, NotFoundException } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');

const USER_POP = { path: 'assignedTo', select: 'name email' };
const COMPANY_POP = { path: 'companyId', select: 'name industry' };
const CONTACT_POP = { path: 'contactId', select: 'firstName lastName email' };

@Injectable()
class DealsService {
  dealModel;
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
        searchFields: ['title', 'description', 'stage', 'status'],
        populate: [USER_POP, COMPANY_POP, CONTACT_POP],
        formatRow: (row) => {
          const base = leanId(row);
          base.name = row.title;
          base.amount = row.value;
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

    const doc = await this.dealModel.create({
      tenantId,
      title,
      value: body.value ?? body.amount ?? 0,
      stage: body.stage || 'lead',
      status: body.status || 'open',
      closeDate: body.closeDate || null,
      companyId: body.companyId || null,
      contactId: body.contactId || null,
      departmentId: body.departmentId || null,
      assignedTo: body.assignedTo || userId,
      description: body.description || '',
    });

    await this.logChange(tenantId, userId, doc._id.toString(), 'created', `Deal created: ${title}`);
    return this.findOne(tenantId, doc._id.toString());
  }

  async findOne(tenantId, id) {
    const deal = await this.dealModel
      .findOne({ _id: id, tenantId })
      .populate([USER_POP, COMPANY_POP, CONTACT_POP, { path: 'departmentId', select: 'name' }])
      .lean();

    if (!deal) throw new NotFoundException('Deal not found');

    const formatted = leanId(deal);
    formatted.name = deal.title;
    formatted.amount = deal.value;
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

    const allowed = ['title', 'stage', 'status', 'value', 'closeDate', 'companyId', 'contactId', 'departmentId', 'assignedTo', 'description'];
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

    if (body.status === 'won' && !deal.closedAt) deal.closedAt = new Date();
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
  }
}

module.exports = { DealsService };
