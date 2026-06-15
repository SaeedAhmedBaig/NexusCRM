import {
  Briefcase,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { KpiCard } from './kpi-card';
import { ROLES } from '../../lib/roles';
import { EmptyState } from '../ui/empty-state';
import { BarChart3 } from 'lucide-react';

function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function WidgetGrid({ widgets }) {
  if (!widgets) return null;

  const { role } = widgets;
  const cards = [];
  const salesRoles = [ROLES.MANAGER, ROLES.OPERATOR, ROLES.CHIEF, ROLES.ADMIN, ROLES.OWNER];

  if (widgets.openDeals != null && salesRoles.includes(role)) {
    cards.push(
      <KpiCard key="open-deals" label="Open deals" value={widgets.openDeals} icon={Briefcase} hint="Active pipeline" />,
    );
  }

  if (widgets.pendingRequests != null && salesRoles.includes(role)) {
    cards.push(
      <KpiCard key="pending-requests" label="Pending requests" value={widgets.pendingRequests} icon={ClipboardList} hint="Awaiting approval" />,
    );
  }

  if (widgets.tasksDueToday != null && role === ROLES.MANAGER) {
    cards.push(
      <KpiCard key="tasks-due" label="Tasks due today" value={widgets.tasksDueToday} icon={CheckSquare} hint="Assigned to you" />,
    );
  }

  if (widgets.myTasks != null && (role === ROLES.CO_WORKER || role === ROLES.TASK_OPERATOR)) {
    cards.push(
      <KpiCard key="my-tasks" label="My open tasks" value={widgets.myTasks} icon={CheckSquare} hint="Needs attention" />,
    );
  }

  if (widgets.unreadMessages != null && (role === ROLES.CO_WORKER || role === ROLES.TASK_OPERATOR)) {
    cards.push(
      <KpiCard key="unread-chat" label="Waiting chats" value={widgets.unreadMessages} icon={MessageSquare} hint="Live chat queue" />,
    );
  }

  if (widgets.incomeSummary != null && role === ROLES.ACCOUNTANT) {
    cards.push(
      <KpiCard key="income" label="Income (30 days)" value={formatCurrency(widgets.incomeSummary)} icon={DollarSign} hint="Won deal revenue" />,
    );
  }

  if (widgets.paymentAlerts != null && role === ROLES.ACCOUNTANT) {
    cards.push(
      <KpiCard key="alerts" label="Payment alerts" value={widgets.paymentAlerts} icon={AlertTriangle} hint="Requires review" />,
    );
  }

  if (widgets.totalDeals != null && [ROLES.CHIEF, ROLES.ADMIN, ROLES.OWNER].includes(role)) {
    cards.push(
      <KpiCard key="total-deals" label="Total deals" value={widgets.totalDeals} icon={TrendingUp} hint="All time" />,
    );
  }

  if (widgets.revenue != null && [ROLES.CHIEF, ROLES.ADMIN, ROLES.OWNER].includes(role)) {
    cards.push(
      <KpiCard key="revenue" label="Total revenue" value={formatCurrency(widgets.revenue)} icon={Trophy} hint="Won deals" />,
    );
  }

  if (!cards.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Your metrics will appear here"
        description="Add deals, tasks, and pipeline data to unlock role-specific KPIs and insights."
      />
    );
  }

  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>;
}
