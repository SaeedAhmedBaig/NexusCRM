const {
  Injectable,
  NotFoundException,
  BadRequestException,
} = require('@nestjs/common');
const {
  PLANS,
  TENANT_STATUSES,
  normalizePlan,
  getPlanLimits,
  PLAN_LIMITS,
} = require('../../common/constants/plans');

const PLAN_MONTHLY_MRR = {
  [PLANS.STARTER]: 0,
  [PLANS.PROFESSIONAL]: 29,
  [PLANS.BUSINESS]: 59,
  [PLANS.ENTERPRISE]: 99,
};

@Injectable()
class SuperadminService {
  tenantModel;
  userTenantModel;
  userModel;
  campaignModel;
  attachmentModel;
  dealModel;
  contactModel;
  systemSettingsModel;
  configService;

  constructor(configService) {
    this.configService = configService;
  }

  getSystemSubdomain() {
    return (this.configService.get('SUPERADMIN_TENANT_SUBDOMAIN') || 'system').toLowerCase().trim();
  }

  isSystemTenant(tenant) {
    return tenant?.subdomain === this.getSystemSubdomain()
      || tenant?.settings?.isSystemTenant === true;
  }

  async ensureSettings() {
    let doc = await this.systemSettingsModel.findOne({ key: 'platform' });
    if (!doc) {
      doc = await this.systemSettingsModel.create({ key: 'platform' });
    }
    return doc.toObject();
  }

  async getSettings() {
    const settings = await this.ensureSettings();
    return {
      defaultPlan: settings.defaultPlan,
      featureFlags: settings.featureFlags || {},
      planPricing: settings.planPricing || {},
      planLimits: PLAN_LIMITS,
    };
  }

  async updateSettings(body = {}) {
    const doc = await this.systemSettingsModel.findOneAndUpdate(
      { key: 'platform' },
      {
        $set: {
          ...(body.defaultPlan ? { defaultPlan: normalizePlan(body.defaultPlan) } : {}),
          ...(body.featureFlags ? { featureFlags: body.featureFlags } : {}),
          ...(body.planPricing ? { planPricing: body.planPricing } : {}),
        },
      },
      { upsert: true, new: true },
    );
    return this.getSettings();
  }

  async listTenants({ search = '', plan = '', status = '' } = {}) {
    const filter = { subdomain: { $ne: this.getSystemSubdomain() } };

    if (plan) filter.plan = normalizePlan(plan);
    if (status) filter.status = status;

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { subdomain: { $regex: q, $options: 'i' } },
      ];
    }

    const tenants = await this.tenantModel.find(filter).sort({ createdAt: -1 }).lean();
    const ids = tenants.map((t) => t._id);

    const [userCounts, mailStats] = await Promise.all([
      this.userTenantModel.aggregate([
        { $match: { tenantId: { $in: ids }, isActive: true } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } },
      ]),
      this.campaignModel.aggregate([
        { $match: { tenantId: { $in: ids } } },
        { $group: { _id: '$tenantId', sent: { $sum: '$sentCount' }, campaigns: { $sum: 1 } } },
      ]),
    ]);

    const usersByTenant = Object.fromEntries(userCounts.map((r) => [r._id.toString(), r.count]));
    const mailByTenant = Object.fromEntries(
      mailStats.map((r) => [r._id.toString(), { sent: r.sent, campaigns: r.campaigns }]),
    );

    return tenants.map((t) => {
      const id = t._id.toString();
      const limits = getPlanLimits(t.plan);
      return {
        id,
        name: t.name,
        subdomain: t.subdomain,
        plan: t.plan,
        status: t.status,
        customDomain: t.customDomain || null,
        createdAt: t.createdAt,
        userCount: usersByTenant[id] || 0,
        massMailSent: mailByTenant[id]?.sent || 0,
        limits,
      };
    });
  }

  async getTenantDetail(id) {
    const tenant = await this.tenantModel.findById(id).lean();
    if (!tenant || this.isSystemTenant(tenant)) {
      throw new NotFoundException('Tenant not found');
    }

    const tenantId = tenant._id;
    const [userCount, massMailAgg, storageAgg, dealCount, contactCount] = await Promise.all([
      this.userTenantModel.countDocuments({ tenantId, isActive: true }),
      this.campaignModel.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            sent: { $sum: '$sentCount' },
            campaigns: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
      ]),
      this.attachmentModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, bytes: { $sum: '$size' }, files: { $sum: 1 } } },
      ]),
      this.dealModel.countDocuments({ tenantId }),
      this.contactModel.countDocuments({ tenantId }),
    ]);

    const mail = massMailAgg[0] || { sent: 0, campaigns: 0, completed: 0 };
    const storage = storageAgg[0] || { bytes: 0, files: 0 };
    const limits = getPlanLimits(tenant.plan);

    return {
      id: tenantId.toString(),
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      status: tenant.status,
      customDomain: tenant.customDomain || null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      limits,
      usage: {
        users: userCount,
        deals: dealCount,
        contacts: contactCount,
        massMailSent: mail.sent,
        massMailCampaigns: mail.campaigns,
        massMailCompleted: mail.completed,
        storageBytes: storage.bytes,
        storageMb: Math.round((storage.bytes / (1024 * 1024)) * 100) / 100,
        attachmentCount: storage.files,
      },
    };
  }

  async setTenantStatus(id, status) {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant || this.isSystemTenant(tenant)) {
      throw new NotFoundException('Tenant not found');
    }

    if (![TENANT_STATUSES.ACTIVE, TENANT_STATUSES.SUSPENDED, TENANT_STATUSES.TRIAL].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    tenant.status = status;
    await tenant.save();

    return {
      id: tenant._id.toString(),
      status: tenant.status,
      message: status === TENANT_STATUSES.SUSPENDED ? 'Tenant suspended' : 'Tenant activated',
    };
  }

  async suspendTenant(id) {
    return this.setTenantStatus(id, TENANT_STATUSES.SUSPENDED);
  }

  async activateTenant(id) {
    return this.setTenantStatus(id, TENANT_STATUSES.ACTIVE);
  }

  async changePlan(id, plan) {
    const normalized = normalizePlan(plan);
    if (!Object.values(PLANS).includes(normalized)) {
      throw new BadRequestException('Invalid plan');
    }

    const tenant = await this.tenantModel.findById(id);
    if (!tenant || this.isSystemTenant(tenant)) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.plan = normalized;
    tenant.settings = {
      ...tenant.settings,
      planChangedAt: new Date().toISOString(),
      planChangedBy: 'superadmin',
    };
    await tenant.save();

    return {
      id: tenant._id.toString(),
      plan: tenant.plan,
      limits: getPlanLimits(tenant.plan),
    };
  }

  async getStats() {
    const systemSub = this.getSystemSubdomain();
    const baseFilter = { subdomain: { $ne: systemSub } };

    const tenants = await this.tenantModel.find(baseFilter).lean();
    const settings = await this.ensureSettings();
    const pricing = settings.planPricing || {};

    const active = tenants.filter((t) => t.status === TENANT_STATUSES.ACTIVE || t.status === TENANT_STATUSES.TRIAL).length;
    const suspended = tenants.filter((t) => t.status === TENANT_STATUSES.SUSPENDED).length;

    let mrr = 0;
    const planBreakdown = {};
    for (const t of tenants) {
      if (t.status === TENANT_STATUSES.SUSPENDED) continue;
      const plan = normalizePlan(t.plan);
      const monthly = pricing[plan]?.monthly ?? PLAN_MONTHLY_MRR[plan] ?? 0;
      mrr += monthly;
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    }

    const now = new Date();
    const mrrHistory = [];
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      const monthTenants = tenants.filter((t) => {
        const created = new Date(t.createdAt);
        return created <= monthEnd && t.status !== TENANT_STATUSES.SUSPENDED;
      });

      let monthMrr = 0;
      for (const t of monthTenants) {
        const plan = normalizePlan(t.plan);
        monthMrr += pricing[plan]?.monthly ?? PLAN_MONTHLY_MRR[plan] ?? 0;
      }

      mrrHistory.push({
        month: label,
        tenants: monthTenants.length,
        mrr: monthMrr,
      });
    }

    const totalUsers = await this.userTenantModel.countDocuments({
      tenantId: { $in: tenants.map((t) => t._id) },
      isActive: true,
    });

    const [totalMailSent] = await this.campaignModel.aggregate([
      { $match: { tenantId: { $in: tenants.map((t) => t._id) } } },
      { $group: { _id: null, sent: { $sum: '$sentCount' } } },
    ]);

    return {
      totalTenants: tenants.length,
      activeTenants: active,
      suspendedTenants: suspended,
      totalUsers,
      mrr: Math.round(mrr * 100) / 100,
      estimatedArr: Math.round(mrr * 12 * 100) / 100,
      totalMassMailSent: totalMailSent?.sent || 0,
      planBreakdown,
      mrrHistory,
    };
  }
}

module.exports = { SuperadminService };
