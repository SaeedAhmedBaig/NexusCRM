const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { CrmListService } = require('./crm-list.service');
const { leanId } = require('./crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase();
}

function splitName(value = '') {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Unknown',
    lastName: parts.slice(1).join(' '),
  };
}

function compactArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function formatUser(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    id: user._id?.toString() || user.id?.toString(),
    name: user.name || user.email || 'User',
    email: user.email || '',
  };
}

function formatLead(row) {
  const base = leanId(row);
  base.name = row.title;
  if (row.companyId && typeof row.companyId === 'object') {
    base.company = { id: row.companyId._id?.toString(), name: row.companyId.name };
  }
  if (row.contactId && typeof row.contactId === 'object') {
    base.contact = {
      id: row.contactId._id?.toString(),
      name: `${row.contactId.firstName || ''} ${row.contactId.lastName || ''}`.trim(),
      email: row.contactId.email,
    };
  }
  if (row.convertedCompanyId && typeof row.convertedCompanyId === 'object') {
    base.convertedCompany = { id: row.convertedCompanyId._id?.toString(), name: row.convertedCompanyId.name };
  }
  if (row.convertedContactId && typeof row.convertedContactId === 'object') {
    base.convertedContact = {
      id: row.convertedContactId._id?.toString(),
      name: `${row.convertedContactId.firstName || ''} ${row.convertedContactId.lastName || ''}`.trim(),
      email: row.convertedContactId.email,
    };
  }
  if (row.convertedDealId && typeof row.convertedDealId === 'object') {
    base.convertedDeal = { id: row.convertedDealId._id?.toString(), name: row.convertedDealId.title };
  }
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  return base;
}

function formatRoutingRule(row) {
  const base = leanId(row);
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  if (row.departmentId && typeof row.departmentId === 'object') {
    base.department = { id: row.departmentId._id?.toString(), name: row.departmentId.name };
  }
  return base;
}

@Injectable()
class LeadsService {
  leadModel;
  leadRoutingRuleModel;
  companyModel;
  contactModel;
  dealModel;
  userTenantModel;
  userModel;
  departmentModel;
  activityEventModel;

  getListService() {
    return new CrmListService(this.leadModel, {
      entityType: 'Lead',
      hrefBase: '/crm/leads',
      searchFields: ['title', 'source', 'status'],
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'companyId', select: 'name' },
        { path: 'contactId', select: 'firstName lastName email' },
        { path: 'convertedCompanyId', select: 'name' },
        { path: 'convertedContactId', select: 'firstName lastName email' },
        { path: 'convertedDealId', select: 'title' },
      ],
      formatRow: formatLead,
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

  async listRoutingRules(tenantId) {
    const rows = await this.leadRoutingRuleModel
      .find({ tenantId })
      .sort({ priority: 1, createdAt: -1 })
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'departmentId', select: 'name' },
      ])
      .lean();
    return rows.map(formatRoutingRule);
  }

  sanitizeRoutingRule(body = {}) {
    const criteria = body.criteria || {};
    return {
      name: body.name,
      description: body.description || '',
      priority: Number(body.priority) || 100,
      active: body.active !== false,
      strategy: body.strategy || 'fixed_owner',
      assignedTo: body.assignedTo || null,
      departmentId: body.departmentId || null,
      criteria: {
        sources: compactArray(criteria.sources),
        statuses: compactArray(criteria.statuses),
        qualificationStages: compactArray(criteria.qualificationStages),
        minValue: criteria.minValue === '' || criteria.minValue === undefined ? null : Number(criteria.minValue),
        maxValue: criteria.maxValue === '' || criteria.maxValue === undefined ? null : Number(criteria.maxValue),
        departmentId: criteria.departmentId || null,
        keywords: compactArray(criteria.keywords).map(normalizeText),
      },
    };
  }

  async createRoutingRule(tenantId, body) {
    if (!body?.name) throw new BadRequestException('Rule name is required');
    const row = await this.leadRoutingRuleModel.create({ tenantId, ...this.sanitizeRoutingRule(body) });
    return formatRoutingRule(await this.leadRoutingRuleModel.findById(row._id).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'departmentId', select: 'name' },
    ]).lean());
  }

  async updateRoutingRule(tenantId, id, body) {
    const row = await this.leadRoutingRuleModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { $set: this.sanitizeRoutingRule(body) },
        { new: true, runValidators: true },
      )
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'departmentId', select: 'name' },
      ])
      .lean();
    if (!row) throw new NotFoundException('Routing rule not found');
    return formatRoutingRule(row);
  }

  async removeRoutingRule(tenantId, id) {
    const result = await this.leadRoutingRuleModel.deleteOne({ _id: id, tenantId });
    if (!result.deletedCount) throw new NotFoundException('Routing rule not found');
    return { id, deleted: true };
  }

  async getLeadOrThrow(tenantId, id) {
    const lead = await this.leadModel.findOne({ _id: id, tenantId }).lean();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  buildDuplicateCandidate(type, row, score, reasons = []) {
    return {
      type,
      id: row._id.toString(),
      title: row.title || row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email || 'Record',
      email: row.email || '',
      phone: row.phone || '',
      companyName: row.companyName || row.name || '',
      confidence: Math.min(score, 100),
      reasons,
      record: leanId(row),
    };
  }

  async findDuplicates(tenantId, id) {
    const lead = await this.getLeadOrThrow(tenantId, id);
    const email = normalizeText(lead.email);
    const phone = normalizeText(lead.phone);
    const companyName = normalizeText(lead.companyName);
    const title = normalizeText(lead.title);

    const orFilters = [];
    if (email) orFilters.push({ email });
    if (phone) orFilters.push({ phone });
    if (companyName) {
      orFilters.push({ companyName: new RegExp(escapeRegex(companyName), 'i') });
      orFilters.push({ name: new RegExp(escapeRegex(companyName), 'i') });
    }
    if (title) orFilters.push({ title: new RegExp(escapeRegex(title), 'i') });

    if (!orFilters.length) return { lead: formatLead(lead), candidates: [] };

    const [leads, contacts, companies] = await Promise.all([
      this.leadModel.find({ tenantId, _id: { $ne: id }, $or: orFilters.filter((f) => f.title || f.email || f.phone || f.companyName) }).limit(20).lean(),
      this.contactModel.find({ tenantId, $or: orFilters.filter((f) => f.email || f.phone) }).limit(20).lean(),
      this.companyModel.find({ tenantId, $or: orFilters.filter((f) => f.name) }).limit(20).lean(),
    ]);

    const candidates = [];
    leads.forEach((row) => {
      const reasons = [];
      let score = 30;
      if (email && normalizeText(row.email) === email) { score += 45; reasons.push('Email match'); }
      if (phone && normalizeText(row.phone) === phone) { score += 35; reasons.push('Phone match'); }
      if (companyName && normalizeText(row.companyName).includes(companyName)) { score += 15; reasons.push('Company name match'); }
      if (title && normalizeText(row.title).includes(title)) { score += 10; reasons.push('Lead title similarity'); }
      candidates.push(this.buildDuplicateCandidate('Lead', row, score, reasons));
    });
    contacts.forEach((row) => {
      const reasons = [];
      let score = 25;
      if (email && normalizeText(row.email) === email) { score += 55; reasons.push('Email match'); }
      if (phone && normalizeText(row.phone) === phone) { score += 30; reasons.push('Phone match'); }
      candidates.push(this.buildDuplicateCandidate('Contact', row, score, reasons));
    });
    companies.forEach((row) => {
      const reasons = ['Company name match'];
      candidates.push(this.buildDuplicateCandidate('Company', row, 70, reasons));
    });

    const sorted = candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
    await this.leadModel.updateOne(
      { _id: id, tenantId },
      { $set: { duplicateCandidateIds: sorted.filter((candidate) => candidate.type === 'Lead').map((candidate) => candidate.id) } },
    );
    return { lead: formatLead(lead), candidates: sorted };
  }

  matchesRule(lead, rule) {
    const criteria = rule.criteria || {};
    if (criteria.sources?.length && !criteria.sources.includes(lead.source)) return false;
    if (criteria.statuses?.length && !criteria.statuses.includes(lead.status)) return false;
    if (criteria.qualificationStages?.length && !criteria.qualificationStages.includes(lead.qualificationStage)) return false;
    if (criteria.departmentId && String(criteria.departmentId) !== String(lead.departmentId || '')) return false;
    if (criteria.minValue !== null && criteria.minValue !== undefined && Number(lead.value || 0) < Number(criteria.minValue)) return false;
    if (criteria.maxValue !== null && criteria.maxValue !== undefined && Number(lead.value || 0) > Number(criteria.maxValue)) return false;
    if (criteria.keywords?.length) {
      const haystack = normalizeText(`${lead.title} ${lead.companyName} ${lead.email} ${lead.source}`);
      if (!criteria.keywords.some((keyword) => haystack.includes(keyword))) return false;
    }
    return true;
  }

  async chooseRoundRobinUser(tenantId, departmentId, lastAssignedUserId) {
    if (!departmentId) return null;
    const members = await this.userTenantModel
      .find({ tenantId, departmentId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    if (!members.length) return null;
    const index = members.findIndex((member) => String(member.userId) === String(lastAssignedUserId));
    return members[(index + 1) % members.length].userId;
  }

  async findMatchingRule(tenantId, lead, ruleId) {
    if (ruleId) {
      const rule = await this.leadRoutingRuleModel.findOne({ _id: ruleId, tenantId, active: true }).lean();
      if (!rule) throw new NotFoundException('Routing rule not found');
      return this.matchesRule(lead, rule) ? rule : null;
    }
    const rules = await this.leadRoutingRuleModel.find({ tenantId, active: true }).sort({ priority: 1, createdAt: 1 }).lean();
    return rules.find((rule) => this.matchesRule(lead, rule)) || null;
  }

  async route(tenantId, userId, id, body = {}) {
    const lead = await this.getLeadOrThrow(tenantId, id);
    const rule = await this.findMatchingRule(tenantId, lead, body.ruleId);
    if (!rule) {
      const row = await this.leadModel.findOneAndUpdate(
        { _id: id, tenantId },
        { $set: { routingStatus: 'no_match', routedAt: new Date() } },
        { new: true },
      ).populate(this.getListService().config.populate).lean();
      await this.recordLeadActivity(tenantId, userId, 'routing_no_match', row, 'No routing rule matched this lead');
      return { routed: false, reason: 'No active routing rule matched', lead: formatLead(row) };
    }

    const departmentId = rule.departmentId || lead.departmentId || null;
    let assignedTo = rule.assignedTo || null;
    if (!assignedTo && ['department_round_robin', 'department_pool'].includes(rule.strategy)) {
      assignedTo = await this.chooseRoundRobinUser(tenantId, departmentId, rule.lastAssignedUserId);
    }
    if (!assignedTo && departmentId) {
      const fallback = await this.userTenantModel.findOne({ tenantId, departmentId, isActive: true }).sort({ createdAt: 1 }).lean();
      assignedTo = fallback?.userId || null;
    }

    const row = await this.leadModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        {
          $set: {
            assignedTo: assignedTo || lead.assignedTo || null,
            departmentId,
            routingStatus: assignedTo || departmentId ? 'routed' : 'failed',
            routedAt: new Date(),
          },
        },
        { new: true, runValidators: true },
      )
      .populate(this.getListService().config.populate)
      .lean();

    await this.leadRoutingRuleModel.updateOne(
      { _id: rule._id, tenantId },
      {
        $set: { lastRunAt: new Date(), lastAssignedUserId: assignedTo || rule.lastAssignedUserId || null },
        $inc: { runCount: 1 },
      },
    );
    await this.recordLeadActivity(tenantId, userId, 'routed', row, `Lead routed by rule: ${rule.name}`, { ruleId: rule._id, assignedTo, departmentId });
    return { routed: row.routingStatus === 'routed', rule: formatRoutingRule(rule), lead: formatLead(row) };
  }

  async convert(tenantId, userId, id, body = {}) {
    const lead = await this.getLeadOrThrow(tenantId, id);
    if (lead.status === 'converted') throw new BadRequestException('Lead is already converted');

    const company = await this.resolveCompany(tenantId, lead, body);
    const contact = await this.resolveContact(tenantId, lead, body, company);
    const deal = body.createDeal === false ? null : await this.createDealFromLead(tenantId, lead, body, company, contact);

    const row = await this.leadModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        {
          $set: {
            status: 'converted',
            qualificationStage: 'accepted',
            companyId: company?._id || null,
            contactId: contact?._id || null,
            convertedAt: new Date(),
            convertedCompanyId: company?._id || null,
            convertedContactId: contact?._id || null,
            convertedDealId: deal?._id || null,
            conversionNotes: body.conversionNotes || '',
          },
        },
        { new: true, runValidators: true },
      )
      .populate(this.getListService().config.populate)
      .lean();

    await this.recordLeadActivity(tenantId, userId, 'converted', row, `Lead converted: ${row.title}`, {
      companyId: company?._id,
      contactId: contact?._id,
      dealId: deal?._id,
    });
    await Promise.all([
      company && this.recordRelatedActivity(tenantId, userId, 'lead_converted', 'Company', company, `Lead converted into account: ${company.name}`),
      contact && this.recordRelatedActivity(tenantId, userId, 'lead_converted', 'Contact', contact, `Lead converted into contact: ${contact.firstName} ${contact.lastName || ''}`.trim()),
      deal && this.recordRelatedActivity(tenantId, userId, 'lead_converted', 'Deal', deal, `Lead converted into opportunity: ${deal.title}`),
    ].filter(Boolean));

    return {
      lead: formatLead(row),
      company: company ? leanId(company) : null,
      contact: contact ? leanId(contact) : null,
      deal: deal ? leanId(deal) : null,
    };
  }

  async resolveCompany(tenantId, lead, body) {
    if (body.companyId) {
      const existing = await this.companyModel.findOne({ _id: body.companyId, tenantId }).lean();
      if (!existing) throw new NotFoundException('Company not found');
      return existing;
    }
    if (lead.companyId) {
      const existing = await this.companyModel.findOne({ _id: lead.companyId, tenantId }).lean();
      if (existing) return existing;
    }
    const name = body.companyName || lead.companyName || lead.title;
    const existing = await this.companyModel.findOne({ tenantId, name: new RegExp(`^${escapeRegex(name)}$`, 'i') }).lean();
    if (existing) return existing;
    return this.companyModel.create({
      tenantId,
      name,
      phone: lead.phone || '',
      status: 'prospect',
      lifecycleStage: 'qualified',
      assignedTo: lead.assignedTo || null,
      departmentId: lead.departmentId || null,
    });
  }

  async resolveContact(tenantId, lead, body, company) {
    if (body.contactId) {
      const existing = await this.contactModel.findOne({ _id: body.contactId, tenantId }).lean();
      if (!existing) throw new NotFoundException('Contact not found');
      return existing;
    }
    if (lead.contactId) {
      const existing = await this.contactModel.findOne({ _id: lead.contactId, tenantId }).lean();
      if (existing) return existing;
    }
    if (lead.email) {
      const existing = await this.contactModel.findOne({ tenantId, email: normalizeText(lead.email) }).lean();
      if (existing) return existing;
    }
    const name = splitName(lead.title);
    return this.contactModel.create({
      tenantId,
      firstName: body.firstName || lead.firstName || name.firstName,
      lastName: body.lastName || lead.lastName || name.lastName,
      email: lead.email || '',
      phone: lead.phone || '',
      jobTitle: body.jobTitle || lead.jobTitle || '',
      companyId: company?._id || null,
      status: 'active',
      assignedTo: lead.assignedTo || null,
      departmentId: lead.departmentId || null,
    });
  }

  createDealFromLead(tenantId, lead, body, company, contact) {
    return this.dealModel.create({
      tenantId,
      title: body.dealTitle || `${lead.title} opportunity`,
      stage: body.dealStage || 'qualified',
      status: 'open',
      value: body.dealValue ?? lead.value ?? 0,
      closeDate: body.closeDate || null,
      companyId: company?._id || null,
      contactId: contact?._id || null,
      departmentId: lead.departmentId || null,
      assignedTo: lead.assignedTo || null,
      description: body.conversionNotes || `Converted from lead: ${lead.title}`,
    });
  }

  recordLeadActivity(tenantId, userId, action, lead, summary, metadata = {}) {
    return recordActivityFromModel(this.leadModel, tenantId, userId, {
      action,
      entityType: 'Lead',
      entityId: lead._id,
      entityName: lead.title,
      record: lead,
      href: `/crm/leads/${lead._id}`,
      summary,
      metadata,
    });
  }

  recordRelatedActivity(tenantId, userId, action, entityType, record, summary) {
    return recordActivityFromModel(this.leadModel, tenantId, userId, {
      action,
      entityType,
      entityId: record._id,
      entityName: record.name || record.title || `${record.firstName || ''} ${record.lastName || ''}`.trim(),
      record,
      href: `/crm/${entityType === 'Company' ? 'companies' : entityType.toLowerCase() + 's'}/${record._id}`,
      summary,
    });
  }
}

module.exports = { LeadsService };
