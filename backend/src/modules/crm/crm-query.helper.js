function parseListQuery(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    sort = { [field]: desc ? -1 : 1 };
  }

  return { page, limit, skip, sort };
}

function buildFilter(tenantId, query, config) {
  const filter = { tenantId };

  if (query.status) filter.status = query.status;
  if (query.stage) filter.stage = query.stage;
  if (query.department || query.departmentId) {
    filter.departmentId = query.department || query.departmentId;
  }
  if (query.owner || query.assignedTo) {
    filter.assignedTo = query.owner || query.assignedTo;
  }
  if (query.companyId) filter.companyId = query.companyId;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (query.q && config.searchFields?.length) {
    const regex = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = config.searchFields.map((field) => ({ [field]: regex }));
  }

  return filter;
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function leanId(doc) {
  if (!doc) return doc;
  const out = { ...doc, id: doc._id?.toString() };
  delete out._id;
  delete out.__v;
  return out;
}

module.exports = { parseListQuery, buildFilter, paginatedResponse, leanId };
