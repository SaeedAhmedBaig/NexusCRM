const { Injectable, NotFoundException } = require('@nestjs/common');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const DEFAULT_SECURITY_POLICY = {
  mfa: { required: false, allowedMethods: ['totp'], gracePeriodDays: 14 },
  sessions: { idleTimeoutMinutes: 60, absoluteTimeoutHours: 12, maxConcurrentSessions: 5 },
  password: { minLength: 8, requireUppercase: true, requireNumber: true, rotationDays: 0 },
  audit: { retentionDays: 365, exportWatermark: true },
};

@Injectable()
class SecurityService {
  tenantModel;
  userTenantModel;
  activityEventModel;
  dataJobModel;

  async overview(tenantId) {
    const [tenant, users, recentEvents, failedJobs, exports] = await Promise.all([
      this.tenantModel.findById(tenantId).lean(),
      this.userTenantModel.countDocuments({ tenantId, isActive: true }),
      this.activityEventModel.find({ tenantId, source: { $in: ['security', 'auth', 'files', 'data-jobs'] } }).sort({ createdAt: -1 }).limit(20).lean(),
      this.dataJobModel.countDocuments({ tenantId, status: 'failed' }),
      this.dataJobModel.countDocuments({ tenantId, type: { $in: ['export', 'report_export'] }, status: 'completed' }),
    ]);
    if (!tenant) throw new NotFoundException('Tenant not found');
    const policy = this.resolvePolicy(tenant);
    return {
      policy,
      activeUsers: users,
      failedJobs,
      completedExports: exports,
      riskSignals: this.riskSignals(policy, failedJobs),
      recentEvents: recentEvents.map(leanId),
    };
  }

  async updatePolicy(tenantId, userId, body = {}) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    const nextPolicy = {
      ...this.resolvePolicy(tenant),
      ...(body.policy || body),
    };
    tenant.settings = {
      ...(tenant.settings || {}),
      security: nextPolicy,
    };
    await tenant.save();
    await recordActivityFromModel(this.activityEventModel, tenantId, userId, {
      action: 'security_policy_updated',
      source: 'security',
      severity: 'medium',
      entityType: 'Tenant',
      entityId: tenant._id,
      entityName: tenant.name,
      summary: 'Security policy updated',
      href: '/settings/security',
      metadata: { policy: nextPolicy },
    });
    return nextPolicy;
  }

  async listEvents(tenantId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);
    const filter = { tenantId };
    if (query.severity) filter.severity = query.severity;
    if (query.source) filter.source = query.source;
    if (query.action) filter.action = query.action;
    const [rows, total] = await Promise.all([
      this.activityEventModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.activityEventModel.countDocuments(filter),
    ]);
    return { data: rows.map(leanId), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async queueAuditExport(tenantId, userId, body = {}) {
    const job = await this.dataJobModel.create({
      tenantId,
      type: 'export',
      objectType: 'ActivityEvent',
      name: body.name || 'Security audit export',
      source: 'security-center',
      status: 'queued',
      options: { format: body.format || 'csv', filters: body.filters || {} },
      requestedBy: userId,
      logs: [{ level: 'info', message: 'Audit export queued from Security Center' }],
    });
    await recordActivityFromModel(this.activityEventModel, tenantId, userId, {
      action: 'audit_export_queued',
      source: 'security',
      severity: 'high',
      entityType: 'DataJob',
      entityId: job._id,
      entityName: job.name,
      summary: 'Security audit export queued',
      href: '/settings/data-jobs',
    });
    return leanId(job.toObject());
  }

  resolvePolicy(tenant) {
    return {
      ...DEFAULT_SECURITY_POLICY,
      ...(tenant.settings?.security || {}),
      mfa: { ...DEFAULT_SECURITY_POLICY.mfa, ...(tenant.settings?.security?.mfa || {}) },
      sessions: { ...DEFAULT_SECURITY_POLICY.sessions, ...(tenant.settings?.security?.sessions || {}) },
      password: { ...DEFAULT_SECURITY_POLICY.password, ...(tenant.settings?.security?.password || {}) },
      audit: { ...DEFAULT_SECURITY_POLICY.audit, ...(tenant.settings?.security?.audit || {}) },
    };
  }

  riskSignals(policy, failedJobs) {
    return [
      !policy.mfa.required ? { severity: 'high', message: 'MFA policy is not required for this workspace.' } : null,
      policy.password.minLength < 10 ? { severity: 'medium', message: 'Password minimum length is below 10 characters.' } : null,
      failedJobs > 0 ? { severity: 'medium', message: `${failedJobs} failed background job(s) need review.` } : null,
    ].filter(Boolean);
  }
}

module.exports = { SecurityService, DEFAULT_SECURITY_POLICY };
