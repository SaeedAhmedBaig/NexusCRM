const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { CrmListService } = require('../crm/crm-list.service');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const PRIORITY_SLA = {
  urgent: { firstResponseHours: 4, resolutionHours: 24 },
  high: { firstResponseHours: 8, resolutionHours: 48 },
  medium: { firstResponseHours: 24, resolutionHours: 72 },
  low: { firstResponseHours: 48, resolutionHours: 120 },
};

function addHours(hours) {
  return new Date(Date.now() + (Number(hours) || 0) * 60 * 60 * 1000);
}

function formatUser(user) {
  if (!user || typeof user !== 'object') return null;
  return { id: user._id?.toString() || user.id, name: user.name || user.email || 'User', email: user.email || '' };
}

function formatTicket(row) {
  const base = leanId(row);
  base.name = row.title;
  if (row.assignedTo && typeof row.assignedTo === 'object') base.owner = formatUser(row.assignedTo);
  if (row.queueId && typeof row.queueId === 'object') base.queue = { id: row.queueId._id?.toString(), name: row.queueId.name };
  if (row.contactId && typeof row.contactId === 'object') {
    base.contact = {
      id: row.contactId._id?.toString(),
      name: `${row.contactId.firstName || ''} ${row.contactId.lastName || ''}`.trim(),
      email: row.contactId.email || '',
    };
  }
  if (row.companyId && typeof row.companyId === 'object') base.company = { id: row.companyId._id?.toString(), name: row.companyId.name };
  if (row.dealId && typeof row.dealId === 'object') base.deal = { id: row.dealId._id?.toString(), name: row.dealId.title };
  return base;
}

@Injectable()
class TicketsService {
  ticketModel;
  ticketQueueModel;
  ticketMacroModel;
  userModel;
  contactModel;
  companyModel;
  dealModel;
  activityEventModel;
  attachmentModel;

  getListService() {
    return new CrmListService(this.ticketModel, {
      entityType: 'Ticket',
      hrefBase: '/service/tickets',
      searchFields: ['title', 'description', 'status', 'priority', 'channel'],
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'queueId', select: 'name slaPolicy defaultAssignee departmentId' },
        { path: 'contactId', select: 'firstName lastName email' },
        { path: 'companyId', select: 'name' },
        { path: 'dealId', select: 'title' },
      ],
      formatRow: formatTicket,
    });
  }

  list(tenantId, query, user) {
    return this.getListService().list(tenantId, query, user);
  }

  async create(tenantId, userId, body = {}) {
    const queue = body.queueId ? await this.ticketQueueModel.findOne({ _id: body.queueId, tenantId }).lean() : null;
    const due = this.calculateDueDates(body.priority || queue?.priority || 'medium', queue);
    const doc = await this.ticketModel.create({
      tenantId,
      title: body.title,
      description: body.description || '',
      status: body.status || 'open',
      priority: body.priority || queue?.priority || 'medium',
      channel: body.channel || 'web',
      queueId: queue?._id || null,
      firstResponseDueAt: body.firstResponseDueAt || due.firstResponseDueAt,
      slaDueAt: body.slaDueAt || due.slaDueAt,
      contactId: body.contactId || null,
      companyId: body.companyId || null,
      dealId: body.dealId || null,
      assignedTo: body.assignedTo || queue?.defaultAssignee || userId,
      createdBy: userId,
      internalNotes: body.internalNotes || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      conversation: body.description ? [{
        body: body.description,
        authorId: userId,
        authorName: 'Requester',
        visibility: 'public',
        direction: 'inbound',
      }] : [],
    });
    await this.recordActivity(tenantId, userId, 'created', doc, `Ticket created: ${doc.title}`);
    return this.findOne(tenantId, doc._id);
  }

  bulk(tenantId, userId, body) {
    return this.getListService().bulk(tenantId, userId, body);
  }

  async findOne(tenantId, id) {
    const row = await this.ticketModel
      .findOne({ _id: id, tenantId })
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'queueId', select: 'name slaPolicy defaultAssignee departmentId' },
        { path: 'contactId', select: 'firstName lastName email phone' },
        { path: 'companyId', select: 'name industry' },
        { path: 'dealId', select: 'title value' },
      ])
      .lean();
    if (!row) throw new NotFoundException('Ticket not found');
    return formatTicket(row);
  }

  async update(tenantId, userId, id, body = {}) {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const previousStatus = ticket.status;
    const allowed = ['title', 'description', 'status', 'priority', 'channel', 'queueId', 'contactId', 'companyId', 'dealId', 'assignedTo', 'internalNotes', 'tags'];
    const changes = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        ticket[key] = body[key] || (['queueId', 'contactId', 'companyId', 'dealId', 'assignedTo'].includes(key) ? null : body[key]);
        changes[key] = body[key];
      }
    }
    if (body.queueId || body.priority) {
      const queue = ticket.queueId ? await this.ticketQueueModel.findOne({ _id: ticket.queueId, tenantId }).lean() : null;
      const due = this.calculateDueDates(ticket.priority, queue);
      if (!ticket.firstResponseAt) ticket.firstResponseDueAt = due.firstResponseDueAt;
      if (!ticket.resolvedAt) ticket.slaDueAt = due.slaDueAt;
    }
    this.applyStatusEffects(ticket, previousStatus);
    this.updateBreachFlags(ticket);
    await ticket.save();
    await this.recordActivity(tenantId, userId, 'updated', ticket, `Ticket updated: ${ticket.title}`, { changes });
    return this.findOne(tenantId, id);
  }

  remove(tenantId, userId, id) {
    return this.getListService().remove(tenantId, userId, id);
  }

  calculateDueDates(priority = 'medium', queue = null) {
    const fallback = PRIORITY_SLA[priority] || PRIORITY_SLA.medium;
    const policy = queue?.slaPolicy || {};
    return {
      firstResponseDueAt: addHours(policy.firstResponseHours || fallback.firstResponseHours),
      slaDueAt: addHours(policy.resolutionHours || fallback.resolutionHours),
    };
  }

  applyStatusEffects(ticket, previousStatus) {
    if (ticket.status !== previousStatus) ticket.statusChangedAt = new Date();
    if (ticket.status === 'resolved' && !ticket.resolvedAt) ticket.resolvedAt = new Date();
    if (ticket.status === 'closed' && !ticket.closedAt) ticket.closedAt = new Date();
    if (!['resolved', 'closed'].includes(ticket.status)) {
      ticket.resolvedAt = ticket.status === 'open' ? null : ticket.resolvedAt;
      ticket.closedAt = null;
    }
  }

  updateBreachFlags(ticket) {
    const now = new Date();
    ticket.firstResponseBreached = Boolean(!ticket.firstResponseAt && ticket.firstResponseDueAt && ticket.firstResponseDueAt < now);
    ticket.resolutionBreached = Boolean(!ticket.resolvedAt && ticket.slaDueAt && ticket.slaDueAt < now);
    ticket.slaBreached = ticket.firstResponseBreached || ticket.resolutionBreached;
  }

  async getConversation(tenantId, id) {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId }).select('conversation').lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return (ticket.conversation || []).map(leanId);
  }

  async addConversationEntry(tenantId, userId, id, body = {}, mode = 'reply') {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const user = userId ? await this.userModel.findById(userId).select('name email').lean().catch(() => null) : null;
    const entry = {
      body: body.body,
      authorId: userId || null,
      authorName: body.authorName || user?.name || user?.email || 'Agent',
      visibility: mode === 'note' ? 'internal' : 'public',
      direction: mode === 'note' ? 'note' : (body.direction || 'outbound'),
      attachments: body.attachments || [],
    };
    if (!entry.body) throw new BadRequestException('body is required');
    ticket.conversation.push(entry);
    if (mode === 'note') {
      ticket.internalNotes = [ticket.internalNotes, entry.body].filter(Boolean).join('\n\n');
    } else {
      ticket.lastAgentReplyAt = new Date();
      if (!ticket.firstResponseAt) ticket.firstResponseAt = ticket.lastAgentReplyAt;
      if (ticket.status === 'open' || ticket.status === 'pending') ticket.status = 'in_progress';
    }
    this.updateBreachFlags(ticket);
    await ticket.save();
    await this.recordActivity(tenantId, userId, mode === 'note' ? 'note_added' : 'reply_added', ticket, mode === 'note' ? `Internal note added: ${ticket.title}` : `Reply added: ${ticket.title}`);
    return this.getConversation(tenantId, id);
  }

  addReply(tenantId, userId, id, body) {
    return this.addConversationEntry(tenantId, userId, id, body, 'reply');
  }

  addNote(tenantId, userId, id, body) {
    return this.addConversationEntry(tenantId, userId, id, body, 'note');
  }

  async applyMacro(tenantId, userId, id, body = {}) {
    const macro = await this.ticketMacroModel.findOne({ _id: body.macroId, tenantId, status: 'active' }).lean();
    if (!macro) throw new NotFoundException('Macro not found');
    const conversation = await this.addConversationEntry(tenantId, userId, id, {
      body: body.body || macro.body,
      direction: 'outbound',
    }, body.asNote ? 'note' : 'reply');
    await this.ticketMacroModel.updateOne({ _id: macro._id }, { $inc: { usageCount: 1 } });
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    const mergedTags = Array.from(new Set([...(ticket.tags || []), ...(macro.tags || [])]));
    ticket.tags = mergedTags;
    await ticket.save();
    await this.recordActivity(tenantId, userId, 'macro_applied', ticket, `Macro applied: ${macro.name}`, { macroId: macro._id });
    return conversation;
  }

  async route(tenantId, userId, id, body = {}) {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const queue = body.queueId
      ? await this.ticketQueueModel.findOne({ _id: body.queueId, tenantId, status: 'active' }).lean()
      : await this.ticketQueueModel.findOne({ tenantId, status: 'active', priority: ticket.priority }).sort({ createdAt: 1 }).lean();
    if (!queue) return { routed: false, reason: 'No active queue matched', ticket: formatTicket(ticket.toObject()) };
    const due = this.calculateDueDates(ticket.priority || queue.priority, queue);
    ticket.queueId = queue._id;
    ticket.assignedTo = body.assignedTo || queue.defaultAssignee || ticket.assignedTo || null;
    if (!ticket.firstResponseAt) ticket.firstResponseDueAt = due.firstResponseDueAt;
    if (!ticket.resolvedAt) ticket.slaDueAt = due.slaDueAt;
    this.updateBreachFlags(ticket);
    await ticket.save();
    await this.recordActivity(tenantId, userId, 'routed', ticket, `Ticket routed to queue: ${queue.name}`, { queueId: queue._id });
    return { routed: true, queue: leanId(queue), ticket: await this.findOne(tenantId, id) };
  }

  async resolve(tenantId, userId, id, body = {}) {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.statusChangedAt = new Date();
    if (body.note) {
      ticket.conversation.push({
        body: body.note,
        authorId: userId,
        authorName: 'Agent',
        visibility: 'internal',
        direction: 'note',
      });
    }
    this.updateBreachFlags(ticket);
    await ticket.save();
    await this.recordActivity(tenantId, userId, 'resolved', ticket, `Ticket resolved: ${ticket.title}`);
    return this.findOne(tenantId, id);
  }

  async reopen(tenantId, userId, id, body = {}) {
    const ticket = await this.ticketModel.findOne({ _id: id, tenantId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'open';
    ticket.statusChangedAt = new Date();
    ticket.closedAt = null;
    if (body.note) {
      ticket.conversation.push({
        body: body.note,
        authorId: userId,
        authorName: 'Agent',
        visibility: 'internal',
        direction: 'note',
      });
    }
    await ticket.save();
    await this.recordActivity(tenantId, userId, 'reopened', ticket, `Ticket reopened: ${ticket.title}`);
    return this.findOne(tenantId, id);
  }

  recordActivity(tenantId, userId, action, ticket, summary, metadata = {}) {
    return recordActivityFromModel(this.ticketModel, tenantId, userId, {
      action,
      entityType: 'Ticket',
      entityId: ticket._id,
      entityName: ticket.title,
      record: ticket,
      href: `/service/tickets/${ticket._id}`,
      summary,
      metadata,
    });
  }
}

module.exports = { TicketsService };
