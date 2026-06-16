const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const crypto = require('crypto');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

function participantsFromMessage(message = {}) {
  return Array.from(new Set([message.from, ...(Array.isArray(message.to) ? message.to : String(message.to || '').split(/[,;]/))].map((item) => String(item || '').trim()).filter(Boolean)));
}

@Injectable()
class SharedInboxService {
  emailAccountModel;
  mailboxThreadModel;
  mailboxMessageModel;
  crmEmailModel;
  activityEventModel;

  async listThreads(tenantId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    const filter = { tenantId };
    if (query.status) filter.status = query.status;
    if (query.accountId) filter.accountId = query.accountId;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.q) filter.$or = [
      { subject: new RegExp(query.q, 'i') },
      { participants: new RegExp(query.q, 'i') },
      { preview: new RegExp(query.q, 'i') },
    ];
    const [rows, total] = await Promise.all([
      this.mailboxThreadModel.find(filter).populate([{ path: 'assignedTo', select: 'name email' }]).sort({ lastMessageAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.mailboxThreadModel.countDocuments(filter),
    ]);
    return { data: rows.map(this.formatThread), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async getThread(tenantId, id) {
    const thread = await this.mailboxThreadModel.findOne({ _id: id, tenantId }).populate([{ path: 'assignedTo', select: 'name email' }]).lean();
    if (!thread) throw new NotFoundException('Inbox thread not found');
    const messages = await this.mailboxMessageModel.find({ tenantId, threadId: id }).sort({ sentAt: 1 }).lean();
    return { ...this.formatThread(thread), messages: messages.map(leanId) };
  }

  async sync(tenantId, userId, body = {}) {
    const account = body.accountId
      ? await this.emailAccountModel.findOne({ _id: body.accountId, tenantId }).lean()
      : await this.emailAccountModel.findOne({ tenantId, doImport: true }).sort({ isMain: -1 }).lean();
    if (!account) throw new BadRequestException('No import-enabled email account');
    const messages = Array.isArray(body.messages) && body.messages.length
      ? body.messages
      : this.sampleProviderMessages(account);
    let imported = 0;
    for (const message of messages) {
      const providerThreadId = message.providerThreadId || crypto.createHash('sha1').update(`${message.subject}:${message.from}`).digest('hex');
      const thread = await this.mailboxThreadModel.findOneAndUpdate(
        { tenantId, accountId: account._id, providerThreadId },
        {
          $setOnInsert: {
            tenantId,
            accountId: account._id,
            provider: account.provider || 'imap',
            providerThreadId,
            subject: message.subject || '(no subject)',
          },
          $set: {
            participants: participantsFromMessage(message),
            preview: String(message.bodyText || message.body || '').slice(0, 180),
            lastMessageAt: message.sentAt ? new Date(message.sentAt) : new Date(),
            read: false,
          },
        },
        { upsert: true, new: true },
      );
      const providerMessageId = message.providerMessageId || crypto.createHash('sha1').update(`${providerThreadId}:${message.bodyText || message.body}:${message.sentAt || ''}`).digest('hex');
      const exists = await this.mailboxMessageModel.findOne({ tenantId, accountId: account._id, providerMessageId }).lean();
      if (!exists) {
        await this.mailboxMessageModel.create({
          tenantId,
          threadId: thread._id,
          accountId: account._id,
          providerMessageId,
          direction: 'inbound',
          from: message.from || '',
          to: Array.isArray(message.to) ? message.to : String(message.to || account.email).split(/[,;]/).map((item) => item.trim()).filter(Boolean),
          subject: message.subject || thread.subject,
          bodyText: message.bodyText || message.body || '',
          bodyHtml: message.bodyHtml || '',
          sentAt: message.sentAt ? new Date(message.sentAt) : new Date(),
        });
        await this.crmEmailModel.create({
          tenantId,
          subject: message.subject || thread.subject,
          body: message.bodyHtml || message.bodyText || message.body || '',
          from: message.from || '',
          to: Array.isArray(message.to) ? message.to.join(', ') : message.to || account.email,
          direction: 'inbound',
          sentAt: message.sentAt ? new Date(message.sentAt) : new Date(),
          sentBy: userId,
        });
        imported += 1;
      }
    }
    await this.emailAccountModel.updateOne({ _id: account._id }, { $set: { lastSyncAt: new Date() } });
    await this.recordActivity(tenantId, userId, 'mailbox_synced', account.email, { imported, accountId: account._id });
    return { imported, account: account.email };
  }

  async assign(tenantId, userId, id, body = {}) {
    const thread = await this.updateThread(tenantId, id, { assignedTo: body.assignedTo || null });
    await this.recordActivity(tenantId, userId, 'inbox_assigned', thread.subject, { threadId: id, assignedTo: body.assignedTo });
    return this.getThread(tenantId, id);
  }

  async markRead(tenantId, id, read = true) {
    await this.updateThread(tenantId, id, { read });
    return this.getThread(tenantId, id);
  }

  async archive(tenantId, userId, id) {
    const thread = await this.updateThread(tenantId, id, { status: 'archived' });
    await this.recordActivity(tenantId, userId, 'inbox_archived', thread.subject, { threadId: id });
    return this.getThread(tenantId, id);
  }

  async linkEntity(tenantId, userId, id, body = {}) {
    const thread = await this.updateThread(tenantId, id, { linkedEntityType: body.entityType || '', linkedEntityId: body.entityId || null });
    await this.recordActivity(tenantId, userId, 'inbox_linked', thread.subject, { threadId: id, entityType: body.entityType, entityId: body.entityId });
    return this.getThread(tenantId, id);
  }

  async reply(tenantId, userId, id, body = {}) {
    const thread = await this.mailboxThreadModel.findOne({ _id: id, tenantId });
    if (!thread) throw new NotFoundException('Inbox thread not found');
    const account = await this.emailAccountModel.findOne({ _id: thread.accountId, tenantId }).lean();
    const message = await this.mailboxMessageModel.create({
      tenantId,
      threadId: thread._id,
      accountId: thread.accountId,
      providerMessageId: `local-${crypto.randomUUID()}`,
      direction: 'outbound',
      visibility: 'public',
      from: account?.email || '',
      to: body.to ? String(body.to).split(/[,;]/).map((item) => item.trim()).filter(Boolean) : thread.participants.filter((item) => item !== account?.email),
      subject: body.subject || thread.subject,
      bodyText: body.body || '',
      sentAt: new Date(),
      createdBy: userId,
    });
    thread.preview = body.body || '';
    thread.lastMessageAt = message.sentAt;
    thread.read = true;
    await thread.save();
    await this.recordActivity(tenantId, userId, 'inbox_reply_sent', thread.subject, { threadId: id });
    return this.getThread(tenantId, id);
  }

  async note(tenantId, userId, id, body = {}) {
    const thread = await this.mailboxThreadModel.findOne({ _id: id, tenantId });
    if (!thread) throw new NotFoundException('Inbox thread not found');
    await this.mailboxMessageModel.create({
      tenantId,
      threadId: thread._id,
      accountId: thread.accountId,
      providerMessageId: `note-${crypto.randomUUID()}`,
      direction: 'note',
      visibility: 'internal',
      from: 'Internal note',
      subject: thread.subject,
      bodyText: body.body || '',
      sentAt: new Date(),
      createdBy: userId,
    });
    await this.recordActivity(tenantId, userId, 'inbox_note_added', thread.subject, { threadId: id });
    return this.getThread(tenantId, id);
  }

  async updateThread(tenantId, id, update) {
    const thread = await this.mailboxThreadModel.findOneAndUpdate({ _id: id, tenantId }, { $set: update }, { new: true });
    if (!thread) throw new NotFoundException('Inbox thread not found');
    return thread;
  }

  formatThread(row) {
    const base = leanId(row);
    if (row.assignedTo?._id) base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name || row.assignedTo.email };
    return base;
  }

  sampleProviderMessages(account) {
    return [
      {
        providerThreadId: `sample-${account._id}-welcome`,
        providerMessageId: `sample-${account._id}-welcome-1`,
        subject: 'Shared inbox sync ready',
        from: 'customer@example.com',
        to: account.email,
        bodyText: 'This synced thread proves the provider-neutral shared inbox pipeline is active.',
        sentAt: new Date(),
      },
    ];
  }

  recordActivity(tenantId, userId, action, title, metadata = {}) {
    return recordActivityFromModel(this.activityEventModel, tenantId, userId, {
      action,
      source: 'mail',
      entityType: 'MailboxThread',
      entityId: metadata.threadId || metadata.accountId,
      entityName: title,
      summary: title ? `${action}: ${title}` : action,
      href: '/inbox',
      metadata,
    });
  }
}

module.exports = { SharedInboxService };
