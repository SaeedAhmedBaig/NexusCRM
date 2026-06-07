const { Injectable } = require('@nestjs/common');
const { ROLES } = require('../../common/constants/roles');

const SALES_ROLES = new Set([ROLES.MANAGER, ROLES.OPERATOR, ROLES.CHIEF, ROLES.ADMIN, ROLES.OWNER]);

function pctChange(current, prior) {
  if (!prior || prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 100);
}

@Injectable()
class DashboardService {
  dealModel;
  taskModel;
  requestModel;
  auditLogModel;
  userModel;
  tenantModel;
  contactModel;
  ticketModel;
  liveChatSessionModel;

  async getWidgets(tenantId, userId, role) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const priorMonthStart = new Date(monthStart);
    priorMonthStart.setMonth(priorMonthStart.getMonth() - 1);
    const priorMonthEnd = new Date(monthStart);
    priorMonthEnd.setMilliseconds(-1);

    const [
      openDeals,
      pendingRequests,
      tasksDueToday,
      myTasks,
      wonDeals,
      totalDeals,
      closedDeals,
      activeCustomers,
      openDealRows,
      openTickets,
      waitingChats,
    ] = await Promise.all([
      this.dealModel.countDocuments({ tenantId, status: 'open' }),
      this.requestModel.countDocuments({ tenantId, status: 'pending' }),
      this.taskModel.countDocuments({
        tenantId,
        assignedTo: userId,
        status: { $ne: 'done' },
        dueDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      this.taskModel.countDocuments({ tenantId, assignedTo: userId, status: { $ne: 'done' } }),
      this.dealModel.find({ tenantId, status: 'won' }).populate('assignedTo', 'name').lean(),
      this.dealModel.countDocuments({ tenantId }),
      this.dealModel.countDocuments({ tenantId, status: 'won' }),
      this.contactModel.countDocuments({ tenantId, status: 'active' }),
      this.dealModel.find({ tenantId, status: 'open' }).lean(),
      this.ticketModel
        ? this.ticketModel.countDocuments({ tenantId, status: { $in: ['open', 'pending', 'in_progress'] } })
        : Promise.resolve(0),
      this.liveChatSessionModel
        ? this.liveChatSessionModel.countDocuments({ tenantId, status: 'waiting' })
        : Promise.resolve(0),
    ]);

    const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const monthlyRevenue = wonDeals
      .filter((d) => {
        const closed = d.closedAt || d.updatedAt;
        return closed && new Date(closed) >= monthStart;
      })
      .reduce((sum, d) => sum + (d.value || 0), 0);
    const priorMonthlyRevenue = wonDeals
      .filter((d) => {
        const closed = d.closedAt || d.updatedAt;
        if (!closed) return false;
        const t = new Date(closed);
        return t >= priorMonthStart && t <= priorMonthEnd;
      })
      .reduce((sum, d) => sum + (d.value || 0), 0);
    const incomeSummary = wonDeals
      .filter((d) => {
        const closed = d.closedAt || d.updatedAt;
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return closed && new Date(closed) >= monthAgo;
      })
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const pipelineValue = openDealRows.reduce((sum, d) => sum + (d.value || 0), 0);
    const conversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;

    const repMap = new Map();
    for (const deal of wonDeals) {
      const repId = deal.assignedTo?._id?.toString() || 'unassigned';
      const name = deal.assignedTo?.name || 'Unassigned';
      if (!repMap.has(repId)) repMap.set(repId, { name, revenue: 0, deals: 0, won: 0 });
      const row = repMap.get(repId);
      row.revenue += deal.value || 0;
      row.won += 1;
    }
    const totalWon = wonDeals.length || 1;
    const teamPerformance = [...repMap.values()].map((r) => ({
      name: r.name,
      revenue: r.revenue,
      conversionRate: Math.round((r.won / totalWon) * 100),
    }));

    const paymentAlerts = await this.requestModel.countDocuments({
      tenantId,
      status: 'pending',
      title: /refund|payment|invoice/i,
    });

    const monthlyTrend = pctChange(monthlyRevenue, priorMonthlyRevenue);

    const widgets = { role };

    if (SALES_ROLES.has(role)) {
      widgets.openDeals = openDeals;
      widgets.pendingRequests = pendingRequests;
      widgets.tasksDueToday = tasksDueToday;
      widgets.showSalesChart = true;
    }

    if (role === ROLES.CO_WORKER || role === ROLES.TASK_OPERATOR) {
      widgets.myTasks = myTasks;
      widgets.unreadMessages = waitingChats;
    }

    if (role === ROLES.ACCOUNTANT) {
      widgets.incomeSummary = incomeSummary;
      widgets.paymentAlerts = paymentAlerts || pendingRequests;
    }

    if ([ROLES.CHIEF, ROLES.OWNER, ROLES.ADMIN].includes(role)) {
      widgets.totalDeals = totalDeals;
      widgets.revenue = revenue;
      widgets.showSalesChart = true;
      widgets.executiveView = true;
      widgets.totalRevenue = revenue;
      widgets.monthlyRevenue = monthlyRevenue;
      widgets.closedDeals = closedDeals;
      widgets.conversionRate = conversionRate;
      widgets.activeCustomers = activeCustomers;
      widgets.supportTickets = openTickets;
      widgets.mrr = monthlyRevenue;
      widgets.pipelineValue = pipelineValue;
      widgets.pipelineTarget = pipelineValue > 0 ? Math.ceil(pipelineValue * 1.25) : 0;
      widgets.teamPerformance = teamPerformance;
      widgets.revenueTrend = monthlyTrend;
      widgets.monthlyTrend = monthlyTrend;
      widgets.mrrTrend = monthlyTrend;
    }

    if (role === ROLES.MANAGER) {
      widgets.openDeals = openDeals;
      widgets.pendingRequests = pendingRequests;
      widgets.tasksDueToday = tasksDueToday;
      widgets.showSalesChart = true;
    }

    return widgets;
  }

  async getRecentActivity(tenantId, limit = 10) {
    const entries = await this.auditLogModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return entries.map((e) => ({
      id: e._id.toString(),
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId?.toString() || null,
      summary: e.summary,
      userName: e.userName,
      href: e.href,
      createdAt: e.createdAt,
    }));
  }

  async getSalesTrend(tenantId, days = 7) {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const deals = await this.dealModel
      .find({
        tenantId,
        status: 'won',
        $or: [{ closedAt: { $gte: start } }, { createdAt: { $gte: start } }],
      })
      .lean();

    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: 0,
      });
    }

    for (const deal of deals) {
      const ref = deal.closedAt || deal.createdAt;
      if (!ref) continue;
      const key = new Date(ref).toISOString().slice(0, 10);
      const bucket = buckets.find((b) => b.date === key);
      if (bucket) bucket.revenue += deal.value || 0;
    }

    return { days: buckets };
  }

  async createRequest(tenantId, userId, { title, description }) {
    const request = await this.requestModel.create({
      tenantId,
      title,
      description: description || '',
      status: 'pending',
      createdBy: userId,
    });

    const user = await this.userModel.findById(userId).lean();
    await this.auditLogModel.create({
      tenantId,
      userId,
      userName: user?.name || 'User',
      action: 'request_created',
      entityType: 'Request',
      entityId: request._id,
      summary: `New request: ${title}`,
      href: '/requests/pending',
    });

    return { id: request._id.toString(), title: request.title, status: request.status };
  }

  async createTask(tenantId, userId, { title, dueDate }) {
    const task = await this.taskModel.create({
      tenantId,
      title,
      status: 'todo',
      assignedTo: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const user = await this.userModel.findById(userId).lean();
    await this.auditLogModel.create({
      tenantId,
      userId,
      userName: user?.name || 'User',
      action: 'task_created',
      entityType: 'Task',
      entityId: task._id,
      summary: `Task created: ${title}`,
      href: `/tasks/${task._id}`,
    });

    return { id: task._id.toString(), title: task.title, status: task.status };
  }

  async sendMassMail(tenantId, userId, { subject, body, recipients }) {
    const user = await this.userModel.findById(userId).lean();
    const count = Array.isArray(recipients) ? recipients.length : 0;

    await this.auditLogModel.create({
      tenantId,
      userId,
      userName: user?.name || 'User',
      action: 'mass_mail_sent',
      entityType: 'Email',
      summary: `Mass mail queued: "${subject}" to ${count || 'all'} recipients`,
      href: '/settings/email',
    });

    return { queued: true, recipientCount: count || 'all', subject };
  }
}

module.exports = { DashboardService };
