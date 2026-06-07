const { ROLES } = require('../constants/roles');

const TENANT_WIDE_ROLES = new Set([
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.CHIEF,
  ROLES.MANAGER,
]);

function applyDepartmentScope(filter, query, user) {
  if (!user?.departmentId || TENANT_WIDE_ROLES.has(user.role)) {
    return filter;
  }
  if (query.department || query.departmentId) {
    return filter;
  }
  return { ...filter, departmentId: user.departmentId };
}

module.exports = { applyDepartmentScope, TENANT_WIDE_ROLES };
