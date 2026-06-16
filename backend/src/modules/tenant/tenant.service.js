const {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} = require('@nestjs/common');
const { PLANS, TENANT_STATUSES } = require('../../common/constants/plans');

const DEFAULT_TRIAL_DAYS = Number(process.env.DEFAULT_TRIAL_DAYS || 14);

@Injectable()
class TenantService {
  tenantModel;

  async create({ name, subdomain, plan = PLANS.STARTER }) {
    const normalized = this.normalizeSubdomain(subdomain);
    const existing = await this.tenantModel.findOne({ subdomain: normalized });
    if (existing) {
      throw new ConflictException('Subdomain is already taken');
    }

    return this.tenantModel.create({
      name,
      subdomain: normalized,
      plan,
      status: TENANT_STATUSES.TRIAL,
      trialEndsAt: new Date(Date.now() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000),
      settings: {},
    });
  }

  async findAll() {
    return this.tenantModel.find().sort({ createdAt: -1 }).lean();
  }

  async findById(id) {
    const tenant = await this.tenantModel.findById(id).lean();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySubdomain(subdomain) {
    const normalized = this.normalizeSubdomain(subdomain);
    const tenant = await this.tenantModel.findOne({ subdomain: normalized }).lean();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async resolveFromHost(host) {
    if (!host) return null;

    const hostname = host.split(':')[0].toLowerCase();
    const appDomain = (process.env.APP_DOMAIN || 'localhost').toLowerCase();

    if (hostname === appDomain || hostname === 'localhost') {
      return null;
    }

    if (hostname.endsWith(`.${appDomain}`)) {
      const subdomain = hostname.slice(0, -(appDomain.length + 1));
      if (!subdomain || subdomain.includes('.')) return null;
      try {
        return await this.findBySubdomain(subdomain);
      } catch {
        return null;
      }
    }

    const tenant = await this.tenantModel.findOne({ customDomain: hostname }).lean();
    return tenant || null;
  }

  async updateSettings(tenantId, actorRole, updates) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (updates.name) tenant.name = updates.name.trim();

    if (updates.subdomain) {
      if (actorRole !== 'owner') {
        throw new BadRequestException('Only the owner can change subdomain');
      }
      const normalized = this.normalizeSubdomain(updates.subdomain);
      const taken = await this.tenantModel.findOne({ subdomain: normalized, _id: { $ne: tenantId } });
      if (taken) throw new ConflictException('Subdomain is already taken');
      tenant.subdomain = normalized;
    }

    if (updates.customDomain !== undefined) {
      const domain = updates.customDomain ? String(updates.customDomain).toLowerCase().trim() : null;
      if (domain) {
        const proPlans = [PLANS.PROFESSIONAL, PLANS.BUSINESS, PLANS.ENTERPRISE, 'Pro', 'Professional', 'Business'];
        if (!proPlans.includes(tenant.plan)) {
          throw new BadRequestException('Custom domain requires Pro or Enterprise plan');
        }
        const taken = await this.tenantModel.findOne({ customDomain: domain, _id: { $ne: tenantId } });
        if (taken) throw new ConflictException('Custom domain is already in use');
      }
      tenant.customDomain = domain;
    }

    if (updates.defaultDepartmentId !== undefined) {
      tenant.defaultDepartmentId = updates.defaultDepartmentId || null;
    }
    if (updates.industry !== undefined) tenant.industry = updates.industry;
    if (updates.currency) tenant.currency = updates.currency;
    if (updates.timezone) tenant.timezone = updates.timezone;
    if (updates.language) tenant.language = updates.language;
    if (updates.taxSettings) tenant.taxSettings = { ...(tenant.taxSettings || {}), ...updates.taxSettings };
    if (updates.branches) tenant.branches = updates.branches;

    if (updates.settings) {
      tenant.settings = { ...(tenant.settings || {}), ...updates.settings };
      if (updates.settings.company) {
        tenant.settings.company = {
          ...(tenant.settings.company || {}),
          ...updates.settings.company,
        };
      }
    }

    await tenant.save();
    return tenant;
  }

  normalizeSubdomain(subdomain) {
    const normalized = String(subdomain || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!normalized || normalized.length < 3) {
      throw new BadRequestException('Subdomain must be at least 3 characters');
    }

    return normalized;
  }
}

module.exports = { TenantService };
