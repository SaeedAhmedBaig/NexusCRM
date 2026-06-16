const { Injectable, BadRequestException, NotFoundException } = require('@nestjs/common');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

@Injectable()
class DataJobsService {
  dataJobModel;

  async list(tenantId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { tenantId };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.objectType) filter.objectType = query.objectType;

    const [rows, total] = await Promise.all([
      this.dataJobModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.dataJobModel.countDocuments(filter),
    ]);

    return {
      data: rows.map(leanId),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(tenantId, userId, body = {}) {
    if (!body.type) throw new BadRequestException('type is required');
    if (!body.objectType) throw new BadRequestException('objectType is required');
    const job = await this.dataJobModel.create({
      tenantId,
      type: body.type,
      objectType: body.objectType,
      name: body.name || `${body.type} ${body.objectType}`,
      source: body.source || 'manual',
      status: 'queued',
      fileName: body.fileName || '',
      fileUrl: body.fileUrl || '',
      mapping: body.mapping || {},
      options: body.options || {},
      requestedBy: userId,
    });
    await this.recordJobActivity(tenantId, userId, 'created', job.toObject());
    return leanId(job.toObject());
  }

  async updateStatus(tenantId, userId, id, body = {}) {
    const job = await this.dataJobModel.findOne({ _id: id, tenantId });
    if (!job) throw new NotFoundException('Data job not found');
    if (body.status) job.status = body.status;
    if (body.processedRows !== undefined) job.processedRows = Number(body.processedRows) || 0;
    if (body.successRows !== undefined) job.successRows = Number(body.successRows) || 0;
    if (body.failedRows !== undefined) job.failedRows = Number(body.failedRows) || 0;
    if (body.totalRows !== undefined) job.totalRows = Number(body.totalRows) || 0;
    if (body.resultUrl !== undefined) job.resultUrl = body.resultUrl || '';
    if (body.errorUrl !== undefined) job.errorUrl = body.errorUrl || '';
    if (body.errorRows !== undefined) job.errorRows = Array.isArray(body.errorRows) ? body.errorRows : [];
    if (body.status === 'running' && !job.startedAt) job.startedAt = new Date();
    if (['completed', 'failed', 'cancelled'].includes(body.status)) job.finishedAt = new Date();
    await job.save();
    await this.recordJobActivity(tenantId, userId, body.status || 'updated', job.toObject());
    return leanId(job.toObject());
  }

  async recordJobActivity(tenantId, userId, action, job) {
    await recordActivityFromModel(this.dataJobModel, tenantId, userId, {
      action,
      entityType: 'DataJob',
      entityId: job._id,
      entityName: job.name,
      summary: `Data job ${action}: ${job.name}`,
      href: '/settings/data-jobs',
      metadata: { type: job.type, objectType: job.objectType, status: job.status },
    });
  }
}

module.exports = { DataJobsService };
