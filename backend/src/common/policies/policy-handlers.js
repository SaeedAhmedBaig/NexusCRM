const canManageUsers = (ability) => ability.can('manage', 'User');
const canReadAnalytics = (ability) => ability.can('read', 'Analytics');
const canManageDepartments = (ability) => ability.can('manage', 'Department');
const canManageGroups = (ability) => ability.can('manage', 'Group');
const canManageSettings = (ability) => ability.can('manage', 'Settings');

module.exports = {
  canManageUsers,
  canReadAnalytics,
  canManageDepartments,
  canManageGroups,
  canManageSettings,
};
