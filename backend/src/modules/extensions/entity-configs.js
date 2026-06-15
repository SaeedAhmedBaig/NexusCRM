const { leanId } = require('../crm/crm-query.helper');

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

const ENTITY_CONFIGS = {
  quotations: {
    searchFields: ['title', 'number', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => ({
      ...body,
      number: body.number || generatedNumber('QT'),
    }),
  },
  orders: {
    searchFields: ['title', 'orderNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => ({
      ...body,
      orderNumber: body.orderNumber || generatedNumber('SO'),
    }),
  },
  invoices: {
    searchFields: ['title', 'invoiceNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
    prepareCreate: (body) => ({
      ...body,
      invoiceNumber: body.invoiceNumber || generatedNumber('INV'),
    }),
  },
  tickets: {
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
  sms: {
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
    searchFields: ['title', 'category', 'content', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.title;
      return base;
    },
  },
  automation: {
    searchFields: ['name', 'trigger', 'action', 'status'],
    populate: [{ path: 'createdBy', select: 'name email' }],
    formatRow: (row) => {
      const base = leanId(row);
      base.name = row.name;
      return base;
    },
  },
  'live-chat': {
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
