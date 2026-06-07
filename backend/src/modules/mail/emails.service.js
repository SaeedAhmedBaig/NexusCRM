const { Injectable, BadRequestException } = require('@nestjs/common');
const nodemailer = require('nodemailer');
const { appendUnsubscribeLink, leanId } = require('./mail.helper');
const { emitNotification } = require('../../realtime/socket-hub');

@Injectable()
class EmailsService {
  emailAccountModel;
  crmEmailModel;
  dealModel;
  unsubscribeModel;
  notificationModel;
  emailAccountsService;

  constructor() {
    this.emailAccountsService = null;
  }

  async send(tenantId, userId, body) {
    const account = body.accountId
      ? await this.emailAccountModel.findOne({ _id: body.accountId, tenantId })
      : await this.emailAccountModel.findOne({ tenantId, isMain: true });

    if (!account) throw new BadRequestException('No email account configured');

    const toList = this.parseRecipients(body.to);
    const ccList = this.parseRecipients(body.cc);
    const bccList = this.parseRecipients(body.bcc);

    const unsubSet = new Set(
      (await this.unsubscribeModel.find({ tenantId }).lean()).map((u) => u.email.toLowerCase()),
    );
    const filteredTo = toList.filter((e) => !unsubSet.has(e.toLowerCase()));
    if (!filteredTo.length) throw new BadRequestException('All recipients are unsubscribed');

    let html = body.bodyHtml || body.body || '';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    html = appendUnsubscribeLink(html, `${appUrl}/unsubscribe?tenant=${tenantId}`);

    const transporter = nodemailer.createTransport(this.emailAccountsService.getSmtpConfig(account));

    if (body.scheduledAt && new Date(body.scheduledAt) > new Date()) {
      return { scheduled: true, scheduledAt: body.scheduledAt, recipients: filteredTo.length };
    }

    await transporter.sendMail({
      from: `"${account.name}" <${account.email}>`,
      to: filteredTo.join(', '),
      cc: ccList.join(', ') || undefined,
      bcc: bccList.join(', ') || undefined,
      subject: body.subject,
      html,
    });

    const saved = await this.crmEmailModel.create({
      tenantId,
      dealId: body.dealId || null,
      requestId: body.requestId || null,
      subject: body.subject,
      body: html,
      from: account.email,
      to: filteredTo.join(', '),
      direction: 'outbound',
      sentBy: userId,
      sentAt: new Date(),
    });

    const result = leanId(saved.toObject());

    if (body.dealId && this.notificationModel) {
      const deal = await this.dealModel?.findOne({ _id: body.dealId, tenantId }).lean();
      const notifyUserId = deal?.assignedTo && String(deal.assignedTo) !== String(userId)
        ? deal.assignedTo
        : null;
      if (notifyUserId) {
        const note = await this.notificationModel.create({
          tenantId,
          userId: notifyUserId,
          type: 'new_email',
          title: 'New email on deal',
          body: body.subject,
          href: `/crm/deals/${body.dealId}`,
          entityType: 'Deal',
          entityId: body.dealId,
          read: false,
        });
        emitNotification(tenantId, String(notifyUserId), {
          id: note._id.toString(),
          title: 'New email on deal',
          body: body.subject,
          href: `/crm/deals/${body.dealId}`,
          read: false,
          createdAt: note.createdAt,
        });
      }
    }

    return result;
  }

  parseRecipients(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

module.exports = { EmailsService };
