function leanId(doc) {
  if (!doc) return doc;
  const out = { ...doc, id: doc._id?.toString() };
  delete out._id;
  delete out.__v;
  return out;
}

function calcProgress(subtasks = []) {
  if (!subtasks.length) return 0;
  const done = subtasks.filter((s) => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

function formatSubtask(st) {
  return {
    id: st._id?.toString(),
    title: st.title,
    completed: st.completed,
    assignedTo: st.assignedTo?.toString?.() || st.assignedTo || null,
    order: st.order || 0,
  };
}

function formatTask(row) {
  const base = leanId(row);
  if (row.projectId && typeof row.projectId === 'object') {
    base.project = { id: row.projectId._id.toString(), name: row.projectId.name, color: row.projectId.color };
    base.projectId = row.projectId._id.toString();
  } else if (row.projectId) {
    base.projectId = row.projectId.toString();
  }
  if (row.assignedTo && typeof row.assignedTo === 'object') {
    base.assignee = { id: row.assignedTo._id.toString(), name: row.assignedTo.name, email: row.assignedTo.email };
    base.assignedTo = row.assignedTo._id.toString();
  }
  if (row.assignees?.length && typeof row.assignees[0] === 'object') {
    base.assigneeList = row.assignees.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
    }));
    base.assignees = row.assignees.map((u) => u._id.toString());
  } else if (row.assignees?.length) {
    base.assignees = row.assignees.map((id) => id.toString());
  }
  base.subtasks = (row.subtasks || []).map(formatSubtask);
  base.workflowLog = (row.workflowLog || []).map((w) => ({
    id: w._id?.toString(),
    at: w.at,
    userId: w.userId?.toString?.() || w.userId,
    userName: w.userName,
    action: w.action,
    note: w.note,
  }));
  base.comments = (row.comments || []).map((c) => ({
    id: c._id?.toString(),
    userId: c.userId?.toString?.() || c.userId,
    userName: c.userName,
    body: c.body,
    createdAt: c.createdAt,
  }));
  base.hiddenForUsers = (row.hiddenForUsers || []).map((id) => id.toString());
  return base;
}

module.exports = { leanId, calcProgress, formatSubtask, formatTask };
