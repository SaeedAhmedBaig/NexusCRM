const { Injectable, NotFoundException } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const OPEN_DEAL_STATUSES = ['open'];
const OPEN_TICKET_STATUSES = ['open', 'pending', 'in_progress'];
const OVERDUE_INVOICE_STATUSES = ['sent', 'overdue'];

function compactIds(rows = []) {
  return rows.map((row) => row._id || row.id).filter(Boolean);
}

function formatUser(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    id: user._id?.toString() || user.id,
    name: user.name || user.email || 'User',
    email: user.email || '',
  };
}

function formatCompany(row) {
  const base = leanId(row);
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  if (row.parentCompanyId && typeof row.parentCompanyId === 'object') {
    base.parentCompany = { id: row.parentCompanyId._id?.toString(), name: row.parentCompanyId.name };
  }
  return base;
}

function formatContact(row) {
  const base = leanId(row);
  base.name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email || 'Contact';
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  return base;
}

function formatOwnedRow(row, nameField = 'title') {
  const base = leanId(row);
  base.name = row[nameField] || row.title || row.name || row.subject || row.invoiceNumber || row.orderNumber || row.number;
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  return base;
}

function formatActivity(row) {
  return {
    id: row._id.toString(),
    action: row.action,
    actorName: row.actorName,
    entityType: row.entityType,
    entityId: row.entityId?.toString() || null,
    entityName: row.entityName,
    summary: row.summary,
    href: row.href,
    createdAt: row.createdAt,
  };
}

@Injectable()
class CompaniesService {
  companyModel;
  contactModel;
  dealModel;
  ticketModel;
  invoiceModel;
  orderModel;
  quotationModel;
  paymentModel;
  crmEmailModel;
  attachmentModel;
  activityEventModel;

  getListService() {
    return new CrmListService(this.companyModel, {
      entityType: 'Company',
      hrefBase: '/crm/companies',
      searchFields: ['name', 'industry', 'website', 'phone'],
      populate: [{ path: 'assignedTo', select: 'name email' }],
      formatRow: formatCompany,
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

  async getAccount360(tenantId, id) {
    const company = await this.companyModel
      .findOne({ _id: id, tenantId })
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'parentCompanyId', select: 'name' },
      ])
      .lean();
    if (!company) throw new NotFoundException('Company not found');

    const [contacts, deals] = await Promise.all([
      this.contactModel
        .find({ tenantId, companyId: id })
        .sort({ updatedAt: -1 })
        .limit(100)
        .populate([{ path: 'assignedTo', select: 'name email' }])
        .lean(),
      this.dealModel
        .find({ tenantId, companyId: id })
        .sort({ updatedAt: -1 })
        .limit(100)
        .populate([{ path: 'assignedTo', select: 'name email' }])
        .lean(),
    ]);

    const contactIds = compactIds(contacts);
    const dealIds = compactIds(deals);
    const relatedFilter = {
      tenantId,
      $or: [
        ...(contactIds.length ? [{ contactId: { $in: contactIds } }] : []),
        ...(dealIds.length ? [{ dealId: { $in: dealIds } }] : []),
      ],
    };
    const hasRelatedFilter = relatedFilter.$or.length > 0;

    const [
      tickets,
      invoices,
      orders,
      quotations,
      payments,
      emails,
      dealAttachments,
      companyAttachments,
    ] = await Promise.all([
      hasRelatedFilter
        ? this.ticketModel.find(relatedFilter).sort({ updatedAt: -1 }).limit(50).populate([{ path: 'assignedTo', select: 'name email' }]).lean()
        : [],
      hasRelatedFilter
        ? this.invoiceModel.find(relatedFilter).sort({ updatedAt: -1 }).limit(50).populate([{ path: 'assignedTo', select: 'name email' }]).lean()
        : [],
      hasRelatedFilter
        ? this.orderModel.find(relatedFilter).sort({ updatedAt: -1 }).limit(50).populate([{ path: 'assignedTo', select: 'name email' }]).lean()
        : [],
      hasRelatedFilter
        ? this.quotationModel.find(relatedFilter).sort({ updatedAt: -1 }).limit(50).populate([{ path: 'assignedTo', select: 'name email' }]).lean()
        : [],
      dealIds.length
        ? this.paymentModel.find({ tenantId, dealId: { $in: dealIds } }).sort({ paidAt: -1, createdAt: -1 }).limit(50).lean()
        : [],
      dealIds.length
        ? this.crmEmailModel.find({ tenantId, dealId: { $in: dealIds } }).sort({ sentAt: -1, createdAt: -1 }).limit(50).lean()
        : [],
      dealIds.length
        ? this.attachmentModel.find({ tenantId, entityType: 'Deal', entityId: { $in: dealIds } }).sort({ createdAt: -1 }).limit(50).lean()
        : [],
      this.attachmentModel.find({ tenantId, entityType: 'Company', entityId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const relatedActivityIds = [
      { entityType: 'Company', entityId: company._id },
      ...contacts.map((row) => ({ entityType: 'Contact', entityId: row._id })),
      ...deals.map((row) => ({ entityType: 'Deal', entityId: row._id })),
      ...tickets.map((row) => ({ entityType: 'Ticket', entityId: row._id })),
      ...invoices.map((row) => ({ entityType: 'Invoice', entityId: row._id })),
      ...orders.map((row) => ({ entityType: 'Order', entityId: row._id })),
      ...quotations.map((row) => ({ entityType: 'Quotation', entityId: row._id })),
    ];

    const activity = await this.activityEventModel
      .find({
        tenantId,
        $or: [
          { entityType: 'Company', entityId: company._id },
          { relatedEntities: { $elemMatch: { entityType: 'Company', entityId: company._id } } },
          ...relatedActivityIds.map((entity) => ({ entityType: entity.entityType, entityId: entity.entityId })),
        ],
      })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const wonDeals = deals.filter((deal) => deal.status === 'won');
    const openDeals = deals.filter((deal) => OPEN_DEAL_STATUSES.includes(deal.status));
    const openTickets = tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status));
    const now = new Date();
    const overdueInvoices = invoices.filter((invoice) => {
      if (!OVERDUE_INVOICE_STATUSES.includes(invoice.status)) return false;
      return invoice.status === 'overdue' || (invoice.dueDate && new Date(invoice.dueDate) < now);
    });
    const lastTouchCandidates = [
      company.updatedAt,
      ...activity.map((row) => row.createdAt),
      ...emails.map((row) => row.sentAt || row.createdAt),
      ...deals.map((row) => row.updatedAt),
      ...tickets.map((row) => row.updatedAt),
    ].filter(Boolean).map((value) => new Date(value));
    const lastTouchDate = lastTouchCandidates.length
      ? new Date(Math.max(...lastTouchCandidates.map((date) => date.getTime())))
      : null;

    return {
      account: formatCompany(company),
      metrics: {
        contacts: contacts.length,
        activeContacts: contacts.filter((contact) => contact.status === 'active').length,
        deals: deals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        wonRevenue: wonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
        pipelineValue: openDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
        openTickets: openTickets.length,
        overdueInvoices: overdueInvoices.length,
        invoices: invoices.length,
        documents: invoices.length + orders.length + quotations.length,
        payments: payments.length,
        recentActivity: activity.length,
        lastTouchDate,
      },
      contacts: contacts.map(formatContact),
      deals: deals.map((row) => formatOwnedRow(row)),
      tickets: tickets.map((row) => formatOwnedRow(row)),
      invoices: invoices.map((row) => formatOwnedRow(row)),
      orders: orders.map((row) => formatOwnedRow(row)),
      quotations: quotations.map((row) => formatOwnedRow(row)),
      payments: payments.map(leanId),
      emails: emails.map(leanId),
      attachments: [...companyAttachments, ...dealAttachments].map(leanId),
      activity: activity.map(formatActivity),
    };
  }

  async updateAccountPlan(tenantId, userId, id, body = {}) {
    const allowed = [
      'lifecycleStage',
      'healthScore',
      'healthStatus',
      'accountTier',
      'renewalDate',
      'ownerNotes',
      'accountPlan',
      'communicationPreferences',
      'parentCompanyId',
    ];
    const payload = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowed.includes(key)),
    );

    if (payload.renewalDate === '') payload.renewalDate = null;
    if (payload.parentCompanyId === '') payload.parentCompanyId = null;
    if (payload.healthScore !== undefined) {
      payload.healthScore = Math.max(0, Math.min(Number(payload.healthScore) || 0, 100));
    }

    const row = await this.companyModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { $set: payload },
        { new: true, runValidators: true },
      )
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'parentCompanyId', select: 'name' },
      ])
      .lean();
    if (!row) throw new NotFoundException('Company not found');

    await recordActivityFromModel(this.companyModel, tenantId, userId, {
      action: 'account_plan_updated',
      entityType: 'Company',
      entityId: row._id,
      entityName: row.name,
      record: row,
      href: `/crm/companies/${row._id}`,
      summary: `Account plan updated: ${row.name}`,
      metadata: { changes: payload },
    });

    return formatCompany(row);
  }
}

module.exports = { CompaniesService };
