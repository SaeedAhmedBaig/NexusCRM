const { leanId } = require('../crm/crm-query.helper');
const { recordActivityFromModel } = require('../activity/activity-recorder');
const ExcelJS = require('exceljs');

const ownerPopulate = [{ path: 'assignedTo', select: 'name email' }];

function withName(row, nameField = 'title') {
  const base = leanId(row);
  base.name = row[nameField] || row.name;
  if (row.assignedTo?._id) {
    base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name };
  }
  return base;
}

function ticketSla(priority = 'medium') {
  const hours = {
    urgent: 4,
    high: 8,
    medium: 24,
    low: 72,
  }[priority] || 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function generatedNumber(prefix) {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

function normalizeLineItems(lineItems = []) {
  return lineItems
    .filter((item) => item?.name || item?.productId)
    .map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const taxable = Math.max(quantity * unitPrice - discount, 0);
      const tax = taxable * (taxRate / 100);
      return {
        productId: item.productId || null,
        name: item.name || item.sku || 'Line item',
        sku: item.sku || '',
        quantity,
        unitPrice,
        discount,
        taxRate,
        total: Math.round((taxable + tax) * 100) / 100,
      };
    });
}

function withDocumentTotals(body) {
  if (!Array.isArray(body.lineItems)) return body;
  const lineItems = normalizeLineItems(body.lineItems);
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const taxable = Math.max(item.quantity * item.unitPrice - item.discount, 0);
    return sum + taxable * (item.taxRate / 100);
  }, 0);
  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  return {
    ...body,
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    amount: Math.round(grandTotal * 100) / 100,
  };
}

async function runAutomationRule(model, { tenantId, userId, id, body = {} }) {
  const rule = await model.findOne({ _id: id, tenantId });
  if (!rule) throw new Error('Automation rule not found');
  const AutomationRun = model.db.model('AutomationRun');
  const startedAt = new Date();
  const run = await AutomationRun.create({
    tenantId,
    ruleId: rule._id,
    triggeredBy: userId,
    trigger: body.trigger || rule.trigger,
    action: rule.action,
    status: 'running',
    input: body.input || {},
    logs: [{ level: 'info', message: `Automation run started for ${rule.name}` }],
    startedAt,
  });

  try {
    const output = {
      action: rule.action,
      message: rule.config?.message || 'Automation evaluated successfully',
      dryRun: body.dryRun !== false,
    };
    run.status = 'succeeded';
    run.output = output;
    run.logs.push({ level: 'info', message: `Action ${rule.action} completed`, data: output });
    rule.failureCount = rule.failureCount || 0;
  } catch (error) {
    run.status = 'failed';
    run.error = error.message;
    run.logs.push({ level: 'error', message: error.message });
    rule.failureCount = (rule.failureCount || 0) + 1;
  } finally {
    run.finishedAt = new Date();
    run.durationMs = run.finishedAt.getTime() - startedAt.getTime();
    await run.save();
    rule.lastRunAt = run.finishedAt;
    rule.lastRunStatus = run.status;
    rule.runCount = (rule.runCount || 0) + 1;
    await rule.save();
  }

  return leanId(run.toObject());
}

function exportFileName(job) {
  const safeTitle = String(job.title || job.reportType || 'report')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'report';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${safeTitle}-${stamp}.${job.format || 'xlsx'}`;
}

function getModel(db, name) {
  try {
    return db.model(name);
  } catch {
    return null;
  }
}

function reportDateFilter(filters = {}) {
  const createdAt = {};
  const start = filters.start || filters.dateFrom;
  const end = filters.end || filters.dateTo;
  if (start) createdAt.$gte = new Date(start);
  if (end) {
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    createdAt.$lte = endDate;
  }
  return Object.keys(createdAt).length ? { createdAt } : {};
}

function flattenValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (value._id) return value.name || value.email || value._id.toString();
    return JSON.stringify(value);
  }
  return value;
}

function toCsv(rows) {
  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const escapeCell = (value) => {
    const text = String(flattenValue(value));
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    columns.map(escapeCell).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(',')),
  ].join('\n');
}

async function toWorkbookBuffer(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  sheet.addRow(columns);
  rows.forEach((row) => sheet.addRow(columns.map((column) => flattenValue(row[column]))));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = Math.min(Math.max(column.values.join('').length / Math.max(rows.length, 1), 14), 36);
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function fetchRows(Model, filter, mapper, limit = 1000) {
  if (!Model) return [];
  const rows = await Model.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map(mapper);
}

async function buildReportRows(db, tenantId, job) {
  const filters = job.filters || {};
  const baseFilter = { tenantId, ...reportDateFilter(filters) };
  const reportType = job.reportType || 'analytics';

  if (reportType === 'sales') {
    const Deal = getModel(db, 'Deal');
    const Invoice = getModel(db, 'Invoice');
    const [deals, invoices] = await Promise.all([
      fetchRows(Deal, baseFilter, (row) => ({
        recordType: 'Deal',
        title: row.title,
        stage: row.stage,
        status: row.status,
        value: row.value || 0,
        currency: row.currency || '',
        createdAt: row.createdAt,
      })),
      fetchRows(Invoice, baseFilter, (row) => ({
        recordType: 'Invoice',
        title: row.title,
        status: row.status,
        amount: row.grandTotal || row.amount || 0,
        currency: row.currency || '',
        createdAt: row.createdAt,
      })),
    ]);
    return [...deals, ...invoices];
  }

  if (reportType === 'customers') {
    const Company = getModel(db, 'Company');
    const Contact = getModel(db, 'Contact');
    const [companies, contacts] = await Promise.all([
      fetchRows(Company, baseFilter, (row) => ({
        recordType: 'Company',
        name: row.name,
        industry: row.industry || '',
        status: row.status || '',
        createdAt: row.createdAt,
      })),
      fetchRows(Contact, baseFilter, (row) => ({
        recordType: 'Contact',
        name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
        email: row.email || '',
        phone: row.phone || '',
        status: row.status || '',
        createdAt: row.createdAt,
      })),
    ]);
    return [...companies, ...contacts];
  }

  if (reportType === 'team') {
    const Task = getModel(db, 'Task');
    return fetchRows(Task, baseFilter, (row) => ({
      title: row.title,
      status: row.status,
      priority: row.priority || '',
      dueDate: row.dueDate || '',
      completedAt: row.completedAt || '',
      createdAt: row.createdAt,
    }));
  }

  if (reportType === 'activity') {
    const ActivityEvent = getModel(db, 'ActivityEvent');
    return fetchRows(ActivityEvent, baseFilter, (row) => ({
      action: row.action,
      entityType: row.entityType,
      entityName: row.entityName,
      actorName: row.actorName,
      summary: row.summary,
      createdAt: row.createdAt,
    }));
  }

  const Deal = getModel(db, 'Deal');
  const Lead = getModel(db, 'Lead');
  const Request = getModel(db, 'Request');
  const [dealCount, wonDealCount, openLeadCount, convertedLeadCount, requestCount, wonDeals] = await Promise.all([
    Deal ? Deal.countDocuments(baseFilter) : 0,
    Deal ? Deal.countDocuments({ ...baseFilter, status: 'won' }) : 0,
    Lead ? Lead.countDocuments({ ...baseFilter, status: { $ne: 'converted' } }) : 0,
    Lead ? Lead.countDocuments({ ...baseFilter, status: 'converted' }) : 0,
    Request ? Request.countDocuments(baseFilter) : 0,
    Deal ? Deal.find({ ...baseFilter, status: 'won' }).select('value').lean() : [],
  ]);
  const wonRevenue = wonDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  return [
    { metric: 'Deals', value: dealCount },
    { metric: 'Won deals', value: wonDealCount },
    { metric: 'Won revenue', value: wonRevenue },
    { metric: 'Open leads', value: openLeadCount },
    { metric: 'Converted leads', value: convertedLeadCount },
    { metric: 'Requests', value: requestCount },
  ];
}

async function buildReportContent(db, tenantId, job) {
  const rows = await buildReportRows(db, tenantId, job);
  if (job.format === 'json') {
    const buffer = Buffer.from(JSON.stringify({ rows, rowCount: rows.length }, null, 2));
    return { rows, buffer, mimeType: 'application/json' };
  }
  if (job.format === 'csv') {
    const buffer = Buffer.from(toCsv(rows));
    return { rows, buffer, mimeType: 'text/csv; charset=utf-8' };
  }
  const buffer = await toWorkbookBuffer(rows);
  return {
    rows,
    buffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

async function runReportExportJob(model, { tenantId, userId, id }) {
  const job = await model.findOne({ _id: id, tenantId });
  if (!job) throw new Error('Report export job not found');
  if (job.status === 'completed') return leanId(job.toObject());

  const startedAt = new Date();
  job.status = 'running';
  job.startedAt = startedAt;
  job.progress = 25;
  job.error = '';
  await job.save();

  try {
    const fileName = exportFileName(job);
    const { rows, buffer, mimeType } = await buildReportContent(model.db, tenantId, job);
    job.status = 'completed';
    job.progress = 100;
    job.rowCount = rows.length;
    job.fileName = fileName;
    job.fileUrl = `/report-export-jobs/${job._id}/download`;
    job.fileMimeType = mimeType;
    job.fileSize = buffer.length;
    job.fileContent = buffer;
    job.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } catch (error) {
    job.status = 'failed';
    job.progress = 100;
    job.error = error.message;
  } finally {
    job.finishedAt = new Date();
    job.durationMs = job.finishedAt.getTime() - startedAt.getTime();
    await job.save();
  }

  await recordActivityFromModel(model, tenantId, userId, {
    action: job.status === 'completed' ? 'completed' : 'failed',
    entityType: 'ReportExportJob',
    entityId: job._id,
    entityName: job.title,
    href: '/reports/exports',
    summary: `Report export ${job.status}: ${job.title}`,
    metadata: {
      format: job.format,
      reportType: job.reportType,
      fileName: job.fileName,
    },
  });

  return leanId(job.toObject());
}

async function downloadReportExportJob(model, { tenantId, id }) {
  const job = await model.findOne({ _id: id, tenantId }).lean();
  if (!job || job.status !== 'completed' || !job.fileContent) {
    throw new Error('Prepared export file not found');
  }
  return {
    fileName: job.fileName || exportFileName(job),
    mimeType: job.fileMimeType || 'application/octet-stream',
    buffer: Buffer.from(job.fileContent),
  };
}

const ENTITY_CONFIGS = {
  quotations: {
    entityType: 'Quotation',
    hrefBase: '/sales/quotations',
    searchFields: ['title', 'number', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => withDocumentTotals({
      ...body,
      number: body.number || generatedNumber('QT'),
    }),
    prepareUpdate: withDocumentTotals,
  },
  orders: {
    entityType: 'Order',
    hrefBase: '/sales/orders',
    searchFields: ['title', 'orderNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => withDocumentTotals({
      ...body,
      orderNumber: body.orderNumber || generatedNumber('SO'),
    }),
    prepareUpdate: withDocumentTotals,
  },
  invoices: {
    entityType: 'Invoice',
    hrefBase: '/sales/invoices',
    searchFields: ['title', 'invoiceNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => withDocumentTotals({
      ...body,
      invoiceNumber: body.invoiceNumber || generatedNumber('INV'),
    }),
    prepareUpdate: withDocumentTotals,
  },
  products: {
    entityType: 'Product',
    hrefBase: '/sales/products',
    searchFields: ['name', 'sku', 'category', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => {
      const base = withName(row, 'name');
      base.amount = row.unitPrice;
      return base;
    },
  },
  tickets: {
    entityType: 'Ticket',
    hrefBase: '/service/tickets',
    searchFields: ['title', 'description', 'status', 'priority'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body, { userId }) => ({
      ...body,
      assignedTo: body.assignedTo || userId,
      firstResponseDueAt: body.firstResponseDueAt || ticketSla(body.priority),
      slaDueAt: body.slaDueAt || ticketSla(body.priority),
      statusChangedAt: new Date(),
    }),
    prepareUpdate: (body) => {
      const next = { ...body };
      if (body.status) {
        next.statusChangedAt = new Date();
        if (['resolved', 'closed'].includes(body.status)) next.resolvedAt = new Date();
      }
      return next;
    },
  },
  'ticket-queues': {
    entityType: 'TicketQueue',
    hrefBase: '/service/queues',
    searchFields: ['name', 'description', 'status', 'priority'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row, 'name'),
  },
  'ticket-macros': {
    entityType: 'TicketMacro',
    hrefBase: '/service/macros',
    searchFields: ['name', 'category', 'body', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.name;
      return base;
    },
  },
  sms: {
    entityType: 'SmsCampaign',
    hrefBase: '/marketing/sms',
    searchFields: ['name', 'message', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.name;
      if (row.createdBy?._id) {
        base.owner = { id: row.createdBy._id.toString(), name: row.createdBy.name };
      }
      return base;
    },
  },
  knowledge: {
    entityType: 'KnowledgeArticle',
    hrefBase: '/service/knowledge',
    searchFields: ['title', 'category', 'content', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.title;
      return base;
    },
  },
  automation: {
    entityType: 'AutomationRule',
    hrefBase: '/automation',
    searchFields: ['name', 'trigger', 'action', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.name;
      return base;
    },
    run: runAutomationRule,
  },
  'report-export-jobs': {
    entityType: 'ReportExportJob',
    hrefBase: null,
    searchFields: ['title', 'reportType', 'format', 'status'],
    filterFields: ['reportType', 'format'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.title;
      delete base.fileContent;
      if (row.createdBy?._id) {
        base.owner = { id: row.createdBy._id.toString(), name: row.createdBy.name };
      }
      return base;
    },
    prepareCreate: (body = {}, { userId }) => ({
      ...body,
      title: body.title || `${body.reportType || 'Analytics'} export`,
      requestedBy: userId,
      status: body.status || 'queued',
      progress: body.progress || 0,
    }),
    run: runReportExportJob,
    download: downloadReportExportJob,
  },
  'live-chat': {
    entityType: 'LiveChatSession',
    hrefBase: '/service/chat',
    searchFields: ['visitorName', 'visitorEmail', 'lastMessage', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.visitorName || 'Visitor';
      if (row.assignedTo?._id) {
        base.owner = { id: row.assignedTo._id.toString(), name: row.assignedTo.name };
      }
      return base;
    },
  },
};

module.exports = { ENTITY_CONFIGS };
