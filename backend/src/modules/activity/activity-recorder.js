function getModel(sourceModel, modelName) {
  try {
    return sourceModel?.db?.model(modelName);
  } catch {
    return null;
  }
}

function getEntityName(record = {}) {
  return (
    record.name ||
    record.title ||
    record.subject ||
    record.invoiceNumber ||
    record.orderNumber ||
    record.number ||
    record.email ||
    null
  );
}

function normalizeRelatedEntity(entityType, entityId, label) {
  if (!entityType || !entityId) return null;
  return { entityType, entityId, label: label || null };
}

function buildRelatedEntities(record = {}) {
  return [
    normalizeRelatedEntity('Company', record.companyId, record.company?.name),
    normalizeRelatedEntity('Contact', record.contactId, record.contact?.name),
    normalizeRelatedEntity('Deal', record.dealId),
    normalizeRelatedEntity('Project', record.projectId, record.project?.name),
    normalizeRelatedEntity('User', record.assignedTo, 'Assigned owner'),
  ].filter(Boolean);
}

async function recordActivityFromModel(sourceModel, tenantId, actorId, event = {}) {
  const ActivityEvent = getModel(sourceModel, 'ActivityEvent');
  if (!ActivityEvent || !tenantId || !event.entityType || !event.entityId || !event.action) return;

  let actorName = 'System';
  const User = getModel(sourceModel, 'User');
  if (User && actorId) {
    const user = await User.findById(actorId).select('name email').lean().catch(() => null);
    actorName = user?.name || user?.email || 'User';
  }

  await ActivityEvent.create({
    tenantId,
    actorId: actorId || null,
    actorName,
    action: event.action,
    source: event.source || 'app',
    entityType: event.entityType,
    entityId: event.entityId,
    entityName: event.entityName || getEntityName(event.record),
    summary: event.summary || `${event.entityType} ${event.action}`,
    href: event.href || null,
    visibility: event.visibility || 'internal',
    relatedEntities: event.relatedEntities || buildRelatedEntities(event.record),
    metadata: event.metadata || {},
  }).catch(() => {});
}

module.exports = { recordActivityFromModel, getEntityName, buildRelatedEntities };
