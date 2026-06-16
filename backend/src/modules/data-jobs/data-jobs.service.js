const { Injectable, BadRequestException, NotFoundException } = require('@nestjs/common');
const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');

const OBJECT_MODEL_MAP = {
  Lead: 'leadModel',
  Contact: 'contactModel',
  Company: 'companyModel',
  Deal: 'dealModel',
  Ticket: 'ticketModel',
  Product: 'productModel',
  Quotation: 'quotationModel',
  Order: 'orderModel',
  Invoice: 'invoiceModel',
  ActivityEvent: 'activityEventModel',
};

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      out.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

function parseRows(content, fileName = '') {
  const trimmed = String(content || '').trim();
  if (!trimmed) return [];
  if (fileName.endsWith('.json') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : parsed.rows || [];
  }
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function toCsv(rows = []) {
  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const escapeCell = (value) => {
    const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(','))].join('\n');
}

function applyMapping(row, mapping = {}) {
  if (!mapping || Object.keys(mapping).length === 0) return row;
  const mapped = {};
  Object.entries(mapping).forEach(([source, target]) => {
    if (target) mapped[target] = row[source];
  });
  return mapped;
}

function requiredFieldFor(objectType) {
  return {
    Lead: 'name',
    Contact: 'email',
    Company: 'name',
    Deal: 'title',
    Ticket: 'title',
    Product: 'name',
    Quotation: 'title',
    Order: 'title',
    Invoice: 'title',
  }[objectType] || 'name';
}

@Injectable()
class DataJobsService {
  dataJobModel;
  fileAssetModel;
  leadModel;
  contactModel;
  companyModel;
  dealModel;
  ticketModel;
  productModel;
  quotationModel;
  orderModel;
  invoiceModel;
  activityEventModel;

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
      sourceFileId: body.sourceFileId || null,
      mapping: body.mapping || {},
      options: body.options || {},
      maxAttempts: Number(body.maxAttempts) || 3,
      requestedBy: userId,
      logs: [{ level: 'info', message: 'Data job queued', data: { type: body.type, objectType: body.objectType } }],
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
    if (body.progress !== undefined) job.progress = Number(body.progress) || 0;
    if (body.errorRows !== undefined) job.errorRows = Array.isArray(body.errorRows) ? body.errorRows : [];
    if (body.logs !== undefined) job.logs.push(...(Array.isArray(body.logs) ? body.logs : []));
    if (body.status === 'running' && !job.startedAt) job.startedAt = new Date();
    if (['completed', 'failed', 'cancelled'].includes(body.status)) job.finishedAt = new Date();
    await job.save();
    await this.recordJobActivity(tenantId, userId, body.status || 'updated', job.toObject());
    return leanId(job.toObject());
  }

  async findOne(tenantId, id) {
    const job = await this.dataJobModel.findOne({ _id: id, tenantId }).lean();
    if (!job) throw new NotFoundException('Data job not found');
    return leanId(job);
  }

  getObjectModel(objectType) {
    const prop = OBJECT_MODEL_MAP[objectType];
    return prop ? this[prop] : null;
  }

  async readFileContent(tenantId, fileId) {
    const asset = await this.fileAssetModel.findOne({ _id: fileId, tenantId, status: 'active' }).lean();
    if (!asset) throw new NotFoundException('Source file not found');
    const fs = require('fs/promises');
    const path = require('path');
    const root = path.resolve(process.env.LOCAL_FILE_STORAGE_DIR || path.join(process.cwd(), 'storage'));
    const buffer = await fs.readFile(path.join(root, asset.storageKey));
    return { content: buffer.toString('utf8'), fileName: asset.originalName || asset.filename };
  }

  async writeArtifact(tenantId, userId, job, filename, content, purpose) {
    const fs = require('fs/promises');
    const path = require('path');
    const crypto = require('crypto');
    const root = path.resolve(process.env.LOCAL_FILE_STORAGE_DIR || path.join(process.cwd(), 'storage'));
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]+/g, '-');
    const storageName = `${crypto.randomUUID()}-${safe}`;
    const folder = path.join(root, String(tenantId));
    await fs.mkdir(folder, { recursive: true });
    const storageKey = path.join(String(tenantId), storageName);
    const buffer = Buffer.from(content);
    await fs.writeFile(path.join(root, storageKey), buffer);
    const asset = await this.fileAssetModel.create({
      tenantId,
      filename: storageName,
      originalName: safe,
      mimeType: filename.endsWith('.json') ? 'application/json' : 'text/csv; charset=utf-8',
      size: buffer.length,
      storageKey,
      entityType: 'DataJob',
      entityId: job._id,
      purpose,
      checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
      uploadedBy: userId,
    });
    return asset;
  }

  async preview(tenantId, id, body = {}) {
    const job = await this.dataJobModel.findOne({ _id: id, tenantId });
    if (!job) throw new NotFoundException('Data job not found');
    if (body.sourceFileId) job.sourceFileId = body.sourceFileId;
    if (body.mapping) job.mapping = body.mapping;
    if (body.options) job.options = body.options;
    if (body.content) {
      const artifact = await this.writeArtifact(tenantId, job.requestedBy, job, body.fileName || job.fileName || 'import.csv', body.content, 'data-import-source');
      job.sourceFileId = artifact._id;
      job.fileName = artifact.originalName;
      job.fileUrl = `/files/${artifact._id}/download`;
    }
    const source = await this.readFileContent(tenantId, job.sourceFileId);
    const rows = parseRows(source.content, source.fileName);
    job.totalRows = rows.length;
    job.previewRows = rows.slice(0, 10);
    job.logs.push({ level: 'info', message: 'Preview generated', data: { rows: rows.length } });
    await job.save();
    return { job: leanId(job.toObject()), rows: job.previewRows };
  }

  async run(tenantId, userId, id) {
    const job = await this.dataJobModel.findOne({ _id: id, tenantId });
    if (!job) throw new NotFoundException('Data job not found');
    if (job.status === 'cancelled') throw new BadRequestException('Cancelled jobs cannot run');
    job.status = 'running';
    job.startedAt = job.startedAt || new Date();
    job.attempt = (job.attempt || 0) + 1;
    job.progress = 5;
    job.logs.push({ level: 'info', message: 'Worker lease acquired', data: { attempt: job.attempt } });
    await job.save();
    try {
      if (job.type === 'import') await this.runImport(tenantId, userId, job);
      else if (job.type === 'export') await this.runExport(tenantId, userId, job);
      else {
        job.logs.push({ level: 'warning', message: `${job.type} jobs are tracked but have no executor yet` });
        job.status = 'completed';
        job.progress = 100;
      }
    } catch (error) {
      job.status = job.attempt < job.maxAttempts ? 'queued' : 'failed';
      job.logs.push({ level: 'error', message: error.message });
    } finally {
      if (['completed', 'failed'].includes(job.status)) job.finishedAt = new Date();
      await job.save();
      await this.recordJobActivity(tenantId, userId, job.status, job.toObject());
    }
    return leanId(job.toObject());
  }

  async runImport(tenantId, userId, job) {
    if (!job.sourceFileId) throw new BadRequestException('Import jobs require a source file');
    const Model = this.getObjectModel(job.objectType);
    if (!Model) throw new BadRequestException(`Unsupported object type: ${job.objectType}`);
    const source = await this.readFileContent(tenantId, job.sourceFileId);
    const rows = parseRows(source.content, source.fileName);
    const required = requiredFieldFor(job.objectType);
    const errors = [];
    const createdIds = [];
    let success = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const mapped = applyMapping(rows[index], job.mapping);
      if (!mapped[required]) {
        errors.push({ row: index + 2, error: `${required} is required`, data: rows[index] });
      } else {
        const doc = await Model.create({ ...mapped, tenantId, createdBy: userId, assignedTo: mapped.assignedTo || userId });
        createdIds.push(doc._id);
        success += 1;
      }
      job.processedRows = index + 1;
      job.progress = Math.min(95, Math.round((job.processedRows / Math.max(rows.length, 1)) * 90));
    }
    job.totalRows = rows.length;
    job.successRows = success;
    job.failedRows = errors.length;
    job.errorRows = errors;
    job.committedRecordIds = createdIds;
    if (errors.length) {
      const artifact = await this.writeArtifact(tenantId, userId, job, `${job.objectType.toLowerCase()}-import-errors.json`, JSON.stringify(errors, null, 2), 'data-import-errors');
      job.errorFileId = artifact._id;
      job.errorUrl = `/files/${artifact._id}/download`;
    }
    job.status = errors.length && success === 0 ? 'failed' : 'completed';
    job.progress = 100;
    job.logs.push({ level: errors.length ? 'warning' : 'info', message: 'Import completed', data: { success, failed: errors.length } });
  }

  async runExport(tenantId, userId, job) {
    const Model = this.getObjectModel(job.objectType);
    if (!Model) throw new BadRequestException(`Unsupported object type: ${job.objectType}`);
    const rows = await Model.find({ tenantId }).sort({ createdAt: -1 }).limit(Number(job.options?.limit) || 1000).lean();
    const cleaned = rows.map((row) => {
      const out = leanId(row);
      delete out.tenantId;
      delete out.__v;
      return out;
    });
    const format = job.options?.format || 'csv';
    const content = format === 'json' ? JSON.stringify(cleaned, null, 2) : toCsv(cleaned);
    const artifact = await this.writeArtifact(tenantId, userId, job, `${job.objectType.toLowerCase()}-export.${format}`, content, 'data-export-result');
    job.totalRows = cleaned.length;
    job.processedRows = cleaned.length;
    job.successRows = cleaned.length;
    job.failedRows = 0;
    job.resultFileId = artifact._id;
    job.resultUrl = `/files/${artifact._id}/download`;
    job.status = 'completed';
    job.progress = 100;
    job.logs.push({ level: 'info', message: 'Export completed', data: { rows: cleaned.length, format } });
  }

  async cancel(tenantId, userId, id) {
    return this.updateStatus(tenantId, userId, id, { status: 'cancelled', logs: [{ level: 'warning', message: 'Job cancelled by user' }] });
  }

  async retry(tenantId, userId, id) {
    const job = await this.dataJobModel.findOne({ _id: id, tenantId });
    if (!job) throw new NotFoundException('Data job not found');
    job.status = 'queued';
    job.progress = 0;
    job.processedRows = 0;
    job.successRows = 0;
    job.failedRows = 0;
    job.errorRows = [];
    job.logs.push({ level: 'info', message: 'Job queued for retry' });
    await job.save();
    await this.recordJobActivity(tenantId, userId, 'retried', job.toObject());
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
