const {
  Injectable,
  NotFoundException,
  BadRequestException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const crypto = require('crypto');
const { verifyRecaptcha } = require('../../common/utils/recaptcha');
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

  constructor(configService) {
    this.configService = configService;
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

  async ensureEmbedTokens(tenantId) {
    const sources = await this.leadSourceModel.find({ tenantId, embedToken: null });
    for (const source of sources) {
      source.embedToken = crypto.randomUUID();
      await source.save();
    }
  }
}

defineParamTypes(PublicService, ConfigService);

module.exports = { PublicService };
