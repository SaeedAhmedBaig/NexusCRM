const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  CHIEF: 'chief',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  CO_WORKER: 'co-worker',
  ACCOUNTANT: 'accountant',
  TASK_OPERATOR: 'task_operator',
};

const ROLE_LABELS = {
  [ROLES.OWNER]: 'Owner',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.CHIEF]: 'Chief',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.CO_WORKER]: 'Co-worker',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.TASK_OPERATOR]: 'Task Operator',
};

const INVITE_ROLES = [
  ROLES.ADMIN,
  ROLES.CHIEF,
  ROLES.MANAGER,
  ROLES.OPERATOR,
  ROLES.CO_WORKER,
  ROLES.ACCOUNTANT,
  ROLES.TASK_OPERATOR,
];

const MANAGEMENT_ROLES = [ROLES.OWNER, ROLES.ADMIN];

const SUBJECTS = {
  ALL: 'all',
  DEAL: 'Deal',
  TASK: 'Task',
  ANALYTICS: 'Analytics',
  USER: 'User',
  DEPARTMENT: 'Department',
  GROUP: 'Group',
  SETTINGS: 'Settings',
};

const DEFAULT_GROUP_TEMPLATES = [
  {
    name: 'Owners',
    slug: 'owners',
    role: ROLES.OWNER,
    permissions: ['manage:all'],
  },
  {
    name: 'Admins',
    slug: 'admins',
    role: ROLES.ADMIN,
    permissions: [
      'manage:User',
      'manage:Department',
      'manage:Group',
      'manage:Deal',
      'manage:Task',
      'read:Analytics',
      'manage:Settings',
    ],
  },
  {
    name: 'Chiefs',
    slug: 'chiefs',
    role: ROLES.CHIEF,
    permissions: ['manage:Deal', 'manage:Task', 'read:Analytics', 'read:User'],
  },
  {
    name: 'Managers',
    slug: 'managers',
    role: ROLES.MANAGER,
    permissions: ['manage:Deal', 'manage:Task', 'read:Analytics', 'read:User'],
  },
  {
    name: 'Operators',
    slug: 'operators',
    role: ROLES.OPERATOR,
    permissions: ['manage:Task', 'read:Deal'],
  },
  {
    name: 'Co-workers',
    slug: 'co-workers',
    role: ROLES.CO_WORKER,
    permissions: ['read:Deal', 'manage:Task'],
  },
  {
    name: 'Accountants',
    slug: 'accountants',
    role: ROLES.ACCOUNTANT,
    permissions: ['read:Analytics', 'manage:Deal'],
  },
  {
    name: 'Task Operators',
    slug: 'task-operators',
    role: ROLES.TASK_OPERATOR,
    permissions: ['manage:Task', 'read:Deal'],
  },
];

module.exports = {
  ROLES,
  ROLE_LABELS,
  INVITE_ROLES,
  MANAGEMENT_ROLES,
  SUBJECTS,
  DEFAULT_GROUP_TEMPLATES,
};
