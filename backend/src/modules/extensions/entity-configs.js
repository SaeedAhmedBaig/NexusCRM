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

const ENTITY_CONFIGS = {
  quotations: {
    searchFields: ['title', 'number', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
  },
  orders: {
    searchFields: ['title', 'orderNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
  },
  invoices: {
    searchFields: ['title', 'invoiceNumber', 'status'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
  },
  tickets: {
    searchFields: ['title', 'description', 'status', 'priority'],
    populate: ownerPopulate,
    formatRow: (row) => withName(row),
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
