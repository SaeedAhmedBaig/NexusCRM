import {
  LayoutDashboard,
  UserPlus,
  Contact,
  Building2,
  Handshake,
  Activity,
  GitBranch,
  FileText,
  ShoppingCart,
  Receipt,
  Megaphone,
  Mail,
  MessageSquare,
  Headphones,
  Ticket,
  BookOpen,
  FolderKanban,
  BarChart3,
  Zap,
  Plug,
  Settings,
  Users,
  Shield,
  CreditCard,
  User,
  Layers,
} from 'lucide-react';

/** PRD-aligned sidebar navigation */
export const NAV_SECTIONS = [
  {
    label: null,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { href: '/crm/leads', label: 'Leads', icon: UserPlus },
      { href: '/crm/contacts', label: 'Contacts', icon: Contact },
      { href: '/crm/companies', label: 'Accounts', icon: Building2 },
      { href: '/crm/deals', label: 'Opportunities', icon: Handshake },
      { href: '/crm/activities', label: 'Activities', icon: Activity },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/sales/pipeline', label: 'Pipeline', icon: GitBranch },
      { href: '/sales/quotations', label: 'Quotations', icon: FileText },
      { href: '/sales/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/sales/invoices', label: 'Invoices', icon: Receipt },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/marketing/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/massmail', label: 'Email Marketing', icon: Mail },
      { href: '/marketing/sms', label: 'SMS Marketing', icon: MessageSquare },
    ],
  },
  {
    label: 'Customer Service',
    items: [
      { href: '/service/tickets', label: 'Tickets', icon: Ticket },
      { href: '/service/chat', label: 'Live Chat', icon: Headphones },
      { href: '/service/knowledge', label: 'Knowledge Base', icon: BookOpen },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/tasks', label: 'Tasks', icon: Activity },
      { href: '/reports', label: 'Reports', icon: BarChart3, action: 'read', subject: 'Analytics' },
      { href: '/automation', label: 'Automation', icon: Zap },
      { href: '/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: User },
      { href: '/settings/tenant', label: 'Organization', icon: Building2, action: 'manage', subject: 'Settings' },
      { href: '/settings/users', label: 'Team', icon: Users, action: 'manage', subject: 'User' },
      { href: '/settings/departments', label: 'Departments', icon: Layers, action: 'manage', subject: 'Department' },
      { href: '/settings/roles', label: 'Roles', icon: Shield, action: 'manage', subject: 'Group' },
      { href: '/settings/billing', label: 'Billing', icon: CreditCard, action: 'manage', subject: 'Settings' },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
