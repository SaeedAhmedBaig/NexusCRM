const canManageUsers = (ability) => ability.can('manage', 'User');
const canReadAnalytics = (ability) => ability.can('read', 'Analytics');
const canManageDepartments = (ability) => ability.can('manage', 'Department');
const canManageGroups = (ability) => ability.can('manage', 'Group');
const canManageSettings = (ability) => ability.can('manage', 'Settings');
const canReadInbox = (ability) => ability.can('read', 'Inbox') || ability.can('manage', 'Inbox');
const canManageInbox = (ability) => ability.can('manage', 'Inbox');
const canManageMail = (ability) => ability.can('manage', 'Mail') || ability.can('manage', 'Settings');
const canManageDataJobs = (ability) => ability.can('manage', 'DataJob') || ability.can('manage', 'Settings');
const canManageFiles = (ability) => ability.can('manage', 'FileAsset') || ability.can('manage', 'Settings');
const canManageSecurity = (ability) => ability.can('manage', 'Security') || ability.can('manage', 'Settings');

module.exports = {
  canManageUsers,
  canReadAnalytics,
  canManageDepartments,
  canManageGroups,
  canManageSettings,
  canReadInbox,
  canManageInbox,
  canManageMail,
  canManageDataJobs,
  canManageFiles,
  canManageSecurity,
};
