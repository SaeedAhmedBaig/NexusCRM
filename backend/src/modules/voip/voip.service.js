const { Injectable, BadRequestException } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { defineParamTypes } = require('../../common/define-param-types');

@Injectable()
class VoipService {
  configService;

  constructor(configService) {
    this.configService = configService;
  }

  async initiateCall(tenantId, userId, { phone, contactId, companyId }) {
    const normalized = String(phone || '').replace(/\s+/g, '');
    if (!normalized || normalized.length < 7) {
      throw new BadRequestException('Valid phone number is required');
    }

    const apiKey = this.configService.get('ZADARMA_KEY');
    const apiSecret = this.configService.get('ZADARMA_SECRET');

    if (!apiKey || !apiSecret) {
      return {
        mock: true,
        dialUrl: `tel:${normalized}`,
        message: 'VoIP provider not configured — use device dialer',
      };
    }

    // Zadarma callback API (simplified — production would sign requests per their docs)
    try {
      const response = await fetch('https://api.zadarma.com/v1/request/callback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          from: this.configService.get('ZADARMA_FROM_NUMBER', ''),
          to: normalized,
        }).toString(),
      });
      const data = await response.json().catch(() => ({}));
      return {
        initiated: true,
        provider: 'zadarma',
        dialUrl: `tel:${normalized}`,
        response: data,
      };
    } catch (err) {
      return {
        mock: true,
        dialUrl: `tel:${normalized}`,
        message: err.message || 'VoIP call failed — falling back to dialer',
      };
    }
  }
}

defineParamTypes(VoipService, ConfigService);

module.exports = { VoipService };
