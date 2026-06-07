const {
  Injectable,
  NotFoundException,
  BadRequestException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const crypto = require('crypto');
const { verifyRecaptcha } = require('../../common/utils/recaptcha');
const { EmailService } = require('../email/email.service');
const { defineParamTypes } = require('../../common/define-param-types');

function lookupGeo(ip) {
  try {
    // eslint-disable-next-line global-require
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(ip);
    if (!geo) return { country: null, city: null };
    return { country: geo.country || null, city: geo.city || null };
  } catch {
    return { country: null, city: null };
  }
}

@Injectable()
class PublicService {
  leadSourceModel;
  requestModel;
  tenantModel;
  configService;
  emailService;

  constructor(configService, emailService) {
    this.configService = configService;
    this.emailService = emailService;
  }

  async getFormByToken(token) {
    const source = await this.leadSourceModel
      .findOne({ embedToken: token, isActive: true })
      .lean();
    if (!source) throw new NotFoundException('Form not found');

    const tenant = await this.tenantModel.findById(source.tenantId).lean();
    return {
      token: source.embedToken,
      name: source.name,
      tenantName: tenant?.name || 'CRM',
      fields: source.formFields || [],
    };
  }

  async addRequest(token, body, ipAddress) {
    const recaptchaSecret = this.configService.get('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret) {
      const valid = await verifyRecaptcha(body.recaptchaToken, recaptchaSecret);
      if (!valid) throw new BadRequestException('reCAPTCHA verification failed');
    }

    const source = await this.leadSourceModel
      .findOne({ embedToken: token, isActive: true });
    if (!source) throw new NotFoundException('Form not found');

    const fields = body.fields || body;
    const name = fields.name || fields.fullName || 'Web form submission';
    const email = fields.email || '';
    const phone = fields.phone || '';
    const message = fields.message || fields.description || '';

    const geo = lookupGeo(ipAddress);

    const request = await this.requestModel.create({
      tenantId: source.tenantId,
      title: `${source.name}: ${name}`,
      description: message,
      status: 'pending',
      source: 'web_form',
      departmentId: source.departmentId || null,
      leadSourceId: source._id,
      submitterName: name,
      submitterEmail: email,
      submitterPhone: phone,
      formData: fields,
      ipAddress,
      country: geo.country,
      city: geo.city,
      createdBy: null,
    });

    return {
      id: request._id,
      message: 'Thank you — your request has been received.',
    };
  }

  async submitContact(body) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const company = String(body.company || '').trim();
    const message = String(body.message || '').trim();
    const type = body.type === 'contact' ? 'contact' : 'demo';
    const sourceUrl = String(body.sourceUrl || '').trim();

    if (!name || !email) {
      throw new BadRequestException('Name and email are required');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('Enter a valid email address');
    }

    const salesEmail =
      this.configService.get('CONTACT_SALES_EMAIL') ||
      this.configService.get('SUPERADMIN_EMAIL') ||
      this.configService.get('BREVO_SENDER_EMAIL');

    if (!salesEmail) {
      throw new BadRequestException('Contact form is not configured on the server');
    }

    try {
      await this.emailService.contactSalesEmail({
        to: salesEmail,
        name,
        email,
        company,
        message,
        type,
        sourceUrl,
      });
    } catch {
      throw new BadRequestException('Could not send your message. Try again shortly.');
    }

    try {
      await this.emailService.contactAckEmail({ to: email, name, type });
    } catch {
      /* acknowledgement is best-effort */
    }

    return {
      sent: true,
      message: 'Thank you — our team will respond within one business day.',
    };
  }

  async ensureEmbedTokens(tenantId) {
    const sources = await this.leadSourceModel.find({ tenantId, embedToken: null });
    for (const source of sources) {
      source.embedToken = crypto.randomUUID();
      await source.save();
    }
  }
}

defineParamTypes(PublicService, ConfigService, EmailService);

module.exports = { PublicService };
