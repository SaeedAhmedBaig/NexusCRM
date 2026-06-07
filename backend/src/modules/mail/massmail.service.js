const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const nodemailer = require('nodemailer');
const { leanId, appendUnsubscribeLink, isBusinessHours } = require('./mail.helper');

@Injectable()
class MassmailService {
  campaignModel;
  templateModel;
  emailAccountModel;
  contactModel;
  companyModel;
  leadModel;
  unsubscribeModel;
  tenantModel;
  emailAccountsService;

  sendingJobs = new Map();

  async ensureSeed(tenantId, userId) {
    const seedEnabled =
      process.env.SEED_DEMO_DATA === 'true';
    if (!seedEnabled) return;

    const claimed = await this.tenantModel.findOneAndUpdate(
      { _id: tenantId, 'settings.massmailSeeded': { $ne: true } },
      { $set: { 'settings.massmailSeeded': true } },
      { new: true },
    );
    if (!claimed) return;

    const tpl = await this.templateModel.create({
      tenantId,
      name: 'Welcome outreach',
      subject: 'Hello from {{company}}',
      bodyHtml: '<p>Hi {{name}},</p><p>We would love to connect with you.</p>',
      isDefault: true,
    });

    await this.campaignModel.create({
      tenantId,
      name: 'Q2 Newsletter',
      status: 'completed',
      templateId: tpl._id,
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml,
      recipientSource: 'contacts',
      totalCount: 120,
      sentCount: 120,
      openCount: 48,
      clickCount: 12,
      createdBy: userId,
      completedAt: new Date(),
    });
  }

  async listCampaigns(tenantId) {
    const rows = await this.campaignModel.find({ tenantId }).sort({ createdAt: -1 }).lean();
    return rows.map((r) => {
      const base = leanId(r);
      base.openRate = r.sentCount ? Math.round((r.openCount / r.sentCount) * 100) : 0;
      base.clickRate = r.sentCount ? Math.round((r.clickCount / r.sentCount) * 100) : 0;
      base.progress = r.totalCount ? Math.round((r.sentCount / r.totalCount) * 100) : 0;
      return base;
    });
  }

  async listTemplates(tenantId) {
    return this.templateModel.find({ tenantId }).sort({ name: 1 }).lean().then((rows) => rows.map(leanId));
  }

  async listUnsubscribes(tenantId) {
    return this.unsubscribeModel.find({ tenantId }).sort({ createdAt: -1 }).lean().then((rows) => rows.map(leanId));
  }

  async unsubscribeEmail(tenantId, email) {
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized || !tenantId) return { ok: false };
    const { generateUnsubscribeToken } = require('./mail.helper');
    await this.unsubscribeModel.findOneAndUpdate(
      { tenantId, email: normalized },
      { $setOnInsert: { token: generateUnsubscribeToken() } },
      { upsert: true, new: true },
    );
    return { ok: true, message: 'Unsubscribed successfully' };
  }

  async resolveRecipients(tenantId, source, filter = {}) {
    let emails = [];

    if (source === 'contacts') {
      const contacts = await this.contactModel.find({ tenantId, email: { $ne: '' } }).lean();
      emails = contacts.map((c) => ({ email: c.email, name: `${c.firstName} ${c.lastName}`.trim() }));
    } else if (source === 'companies') {
      const companies = await this.companyModel.find({ tenantId }).lean();
      emails = companies.filter((c) => c.website?.includes('@')).map((c) => ({ email: c.website, name: c.name }));
    } else if (source === 'leads') {
      const leads = await this.leadModel.find({ tenantId }).populate('contactId', 'email firstName lastName').lean();
      emails = leads
        .filter((l) => l.contactId?.email)
        .map((l) => ({
          email: l.contactId.email,
          name: `${l.contactId.firstName || ''} ${l.contactId.lastName || ''}`.trim() || l.title,
        }));
    } else if (source === 'manual') {
      emails = (filter.emails || []).map((e) => ({ email: e, name: e }));
    }

    const unsub = new Set(
      (await this.unsubscribeModel.find({ tenantId }).lean()).map((u) => u.email.toLowerCase()),
    );
    return emails.filter((e) => e.email && !unsub.has(e.email.toLowerCase()));
  }

  async previewRecipients(tenantId, body) {
    const recipients = await this.resolveRecipients(tenantId, body.recipientSource, body.recipientFilter);
    return { total: recipients.length, preview: recipients.slice(0, 50) };
  }

  async createCampaign(tenantId, userId, body) {
    const recipients = body.recipientEmails?.length
      ? body.recipientEmails.map((e) => ({ email: e }))
      : await this.resolveRecipients(tenantId, body.recipientSource, body.recipientFilter);

    let subject = body.subject;
    let bodyHtml = body.bodyHtml;
    if (body.templateId) {
      const tpl = await this.templateModel.findOne({ _id: body.templateId, tenantId }).lean();
      if (tpl) {
        subject = subject || tpl.subject;
        bodyHtml = bodyHtml || tpl.bodyHtml;
      }
    }

    const campaign = await this.campaignModel.create({
      tenantId,
      name: body.name,
      status: body.scheduledAt ? 'scheduled' : 'draft',
      templateId: body.templateId || null,
      subject: subject || body.name,
      bodyHtml: bodyHtml || '',
      accountId: body.accountId || null,
      recipientSource: body.recipientSource || 'contacts',
      recipientFilter: body.recipientFilter || {},
      recipientEmails: recipients.map((r) => r.email),
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      businessHoursOnly: Boolean(body.businessHoursOnly),
      totalCount: recipients.length,
      createdBy: userId,
    });

    return leanId(campaign.toObject());
  }

  async getCampaign(tenantId, id) {
    const campaign = await this.campaignModel.findOne({ _id: id, tenantId }).lean();
    if (!campaign) throw new NotFoundException('Campaign not found');
    const base = leanId(campaign);
    base.openRate = campaign.sentCount ? Math.round((campaign.openCount / campaign.sentCount) * 100) : 0;
    base.clickRate = campaign.sentCount ? Math.round((campaign.clickCount / campaign.sentCount) * 100) : 0;
    base.progress = campaign.totalCount
      ? Math.round((campaign.sentCount / campaign.totalCount) * 100)
      : 0;
    return base;
  }

  async sendCampaign(tenantId, id) {
    const campaign = await this.campaignModel.findOne({ _id: id, tenantId });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'sending') return { queued: true, campaignId: id };
    if (campaign.status === 'completed') throw new BadRequestException('Campaign already completed');

    if (campaign.businessHoursOnly && !isBusinessHours()) {
      throw new BadRequestException('Business hours only — try again Mon–Fri 9am–5pm');
    }

    const account = campaign.accountId
      ? await this.emailAccountModel.findById(campaign.accountId)
      : await this.emailAccountModel.findOne({ tenantId, isMain: true, doMassmail: true });

    campaign.status = 'sending';
    campaign.startedAt = new Date();
    campaign.sentCount = 0;
    await campaign.save();

    this.processCampaignSend(campaign, account).catch(() => {});

    return { queued: true, campaignId: id, totalCount: campaign.totalCount };
  }

  async processCampaignSend(campaign, account) {
    const tenantId = campaign.tenantId;
    const emails = campaign.recipientEmails || [];
    const unsub = new Set(
      (await this.unsubscribeModel.find({ tenantId }).lean()).map((u) => u.email.toLowerCase()),
    );
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    let transporter = null;
    if (account) {
      transporter = nodemailer.createTransport(this.emailAccountsService.getSmtpConfig(account));
    }

    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      for (const email of batch) {
        if (unsub.has(email.toLowerCase())) continue;

        const html = appendUnsubscribeLink(
          campaign.bodyHtml || '<p>Hello</p>',
          `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}&tenant=${tenantId}`,
        );

        try {
          if (transporter) {
            await transporter.sendMail({
              from: account ? `"${account.name}" <${account.email}>` : 'noreply@nexuscrm.local',
              to: email,
              subject: campaign.subject,
              html,
            });
          }
        } catch {
          /* continue on individual failures in dev */
        }

        campaign.sentCount += 1;
      }

      campaign.markModified('sentCount');
      await campaign.save();
      await new Promise((r) => setTimeout(r, 50));
    }

    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();
  }
}

module.exports = { MassmailService };
