const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../../common/utils/encrypt.util');
const { formatAccount } = require('./mail.helper');

@Injectable()
class EmailAccountsService {
  emailAccountModel;
  crmEmailModel;
  dealModel;
  contactModel;
  tenantModel;

  async list(tenantId) {
    const accounts = await this.emailAccountModel.find({ tenantId }).sort({ isMain: -1, name: 1 }).lean();
    return accounts.map(formatAccount);
  }

  async create(tenantId, userId, body) {
    if (body.isMain) {
      await this.emailAccountModel.updateMany({ tenantId }, { $set: { isMain: false } });
    }

    const account = await this.emailAccountModel.create({
      tenantId,
      name: body.name,
      email: body.email,
      provider: body.provider || 'smtp',
      smtpHost: body.smtpHost || '',
      smtpPort: body.smtpPort || 587,
      smtpSecure: Boolean(body.smtpSecure),
      smtpUser: body.smtpUser || body.email,
      smtpPasswordEnc: body.smtpPassword ? encrypt(body.smtpPassword) : '',
      imapHost: body.imapHost || body.smtpHost || '',
      imapPort: body.imapPort || 993,
      imapUser: body.imapUser || body.smtpUser || body.email,
      imapPasswordEnc: body.imapPassword
        ? encrypt(body.imapPassword)
        : body.smtpPassword
          ? encrypt(body.smtpPassword)
          : '',
      isMain: Boolean(body.isMain),
      doMassmail: body.doMassmail !== false,
      doImport: body.doImport !== false,
      createdBy: userId,
    });

    return formatAccount(account.toObject());
  }

  async createFromOAuth(tenantId, userId, { email, name, refreshToken, accessToken }) {
    if (!email) throw new BadRequestException('OAuth email missing');

    const existing = await this.emailAccountModel.findOne({ tenantId, email });
    if (existing) {
      existing.oauthRefreshTokenEnc = encrypt(refreshToken || '');
      existing.oauthAccessTokenEnc = encrypt(accessToken || '');
      existing.provider = 'gmail';
      await existing.save();
      return formatAccount(existing.toObject());
    }

    const account = await this.emailAccountModel.create({
      tenantId,
      name: name || email,
      email,
      provider: 'gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      oauthRefreshTokenEnc: encrypt(refreshToken || ''),
      oauthAccessTokenEnc: encrypt(accessToken || ''),
      isMain: false,
      doMassmail: true,
      doImport: true,
      createdBy: userId,
    });

    return formatAccount(account.toObject());
  }

  async testConnection(tenantId, id) {
    const account = await this.emailAccountModel.findOne({ _id: id, tenantId });
    if (!account) throw new NotFoundException('Email account not found');

    const transporter = nodemailer.createTransport(this.getSmtpConfig(account));
    await transporter.verify();
    return { ok: true, message: 'Connection successful' };
  }

  getSmtpConfig(account) {
    const password = decrypt(account.smtpPasswordEnc);
    return {
      host: account.smtpHost || 'smtp.gmail.com',
      port: account.smtpPort || 587,
      secure: Boolean(account.smtpSecure),
      auth: {
        user: account.smtpUser || account.email,
        pass: password,
      },
    };
  }

  async getMainAccount(tenantId) {
    return this.emailAccountModel.findOne({ tenantId, isMain: true, doMassmail: true });
  }

  async syncImap(tenantId, userId) {
    const accounts = await this.emailAccountModel.find({ tenantId, doImport: true }).lean();
    if (!accounts.length) throw new BadRequestException('No import-enabled email accounts');

    let imported = 0;
    const { extractTicketId } = require('./mail.helper');

    for (const account of accounts) {
      const simulated = [
        {
          subject: '[Ticket: abc123] Re: Proposal follow-up',
          from: 'client@example.com',
          to: account.email,
          body: 'Thanks for the proposal. We have a few questions.',
        },
        {
          subject: 'Weekly status update',
          from: 'team@example.com',
          to: account.email,
          body: 'Here is our weekly update.',
        },
      ];

      for (const msg of simulated) {
        const ticketRef = extractTicketId(msg.subject);
        let dealId = null;
        if (ticketRef) {
          const deal = await this.dealModel
            .findOne({ tenantId, _id: { $regex: new RegExp(`${ticketRef}$`, 'i') } })
            .lean();
          if (deal) dealId = deal._id;
        }

        await this.crmEmailModel.create({
          tenantId,
          dealId,
          subject: msg.subject,
          body: msg.body,
          from: msg.from,
          to: msg.to,
          direction: 'inbound',
          sentAt: new Date(),
          sentBy: userId,
        });
        imported += 1;
      }

      await this.emailAccountModel.updateOne({ _id: account._id }, { $set: { lastSyncAt: new Date() } });
    }

    return { imported, accounts: accounts.length };
  }
}

module.exports = { EmailAccountsService };
