const { Injectable } = require('@nestjs/common');
const ExcelJS = require('exceljs');
const { DEAL_STAGES } = require('../crm/schemas/deal.schema');
const { LEAD_SOURCES } = require('../crm/schemas/lead.schema');

@Injectable()
class AnalyticsService {
  dealModel;
  leadModel;
  requestModel;
  taskModel;

  parseRange(query) {
    const now = new Date();
    const start = query.start ? new Date(query.start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query.end ? new Date(query.end) : now;
    end.setHours(23, 59, 59, 999);
    return { start, end, departmentId: query.department || null };
  }

  baseFilter(tenantId, { start, end, departmentId }) {
    const filter = {
      tenantId,
      createdAt: { $gte: start, $lte: end },
    };
    if (departmentId) filter.departmentId = departmentId;
    return filter;
  }

  async incomeSummary(tenantId, query) {
    const range = this.parseRange(query);
    const deals = await this.dealModel
      .find({
        tenantId,
        status: 'won',
        $or: [
          { closedAt: { $gte: range.start, $lte: range.end } },
          { createdAt: { $gte: range.start, $lte: range.end } },
        ],
        ...(range.departmentId ? { departmentId: range.departmentId } : {}),
      })
      .lean();

    const months = {};
    let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    while (cursor <= range.end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: key, actual: 0, forecast: 0 };
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    for (const deal of deals) {
      const ref = deal.closedAt || deal.createdAt;
      const key = `${new Date(ref).getFullYear()}-${String(new Date(ref).getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].actual += deal.value || 0;
    }

    const openDeals = await this.dealModel.find({ tenantId, status: 'open' }).lean();
    const forecastTotal = openDeals.reduce((s, d) => s + (d.value || 0), 0);
    const monthKeys = Object.keys(months);
    const perMonthForecast = monthKeys.length ? Math.round(forecastTotal / monthKeys.length) : 0;
    monthKeys.forEach((k) => {
      months[k].forecast = perMonthForecast;
    });

    return {
      range: { start: range.start, end: range.end },
      months: Object.values(months),
      totalActual: Object.values(months).reduce((s, m) => s + m.actual, 0),
      totalForecast: forecastTotal,
    };
  }

  async salesFunnel(tenantId, query) {
    const range = this.parseRange(query);
    const filter = {
      tenantId,
      createdAt: { $gte: range.start, $lte: range.end },
      ...(range.departmentId ? { departmentId: range.departmentId } : {}),
    };

    const deals = await this.dealModel.find(filter).lean();
    const total = deals.length || 1;

    const stages = DEAL_STAGES.map((stage) => {
      const count = deals.filter((d) => d.stage === stage).length;
      return {
        stage,
        count,
        percentage: Math.round((count / total) * 100),
      };
    });

    return { total: deals.length, stages };
  }

  async leadSourcePerformance(tenantId, query) {
    const range = this.parseRange(query);
    const filter = this.baseFilter(tenantId, range);

    const leads = await this.leadModel.find(filter).lean();
    const sources = LEAD_SOURCES.map((source) => {
      const rows = leads.filter((l) => l.source === source);
      const converted = rows.filter((l) => l.status === 'converted').length;
      return {
        source,
        requests: rows.length,
        converted,
        conversionRate: rows.length ? Math.round((converted / rows.length) * 100) : 0,
      };
    });

    return { sources };
  }

  async conversionSummary(tenantId, query) {
    const range = this.parseRange(query);
    const reqFilter = this.baseFilter(tenantId, range);
    const dealFilter = {
      tenantId,
      status: 'won',
      closedAt: { $gte: range.start, $lte: range.end },
      ...(range.departmentId ? { departmentId: range.departmentId } : {}),
    };

    const [requests, deals] = await Promise.all([
      this.requestModel.find(reqFilter).lean(),
      this.dealModel.find(dealFilter).lean(),
    ]);

    const buckets = {};
    const cursor = new Date(range.start);
    while (cursor <= range.end) {
      const key = cursor.toISOString().slice(0, 10);
      buckets[key] = { date: key, requests: 0, deals: 0, rate: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }

    requests.forEach((r) => {
      const key = new Date(r.createdAt).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].requests += 1;
    });
    deals.forEach((d) => {
      const key = new Date(d.closedAt || d.createdAt).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].deals += 1;
    });

    Object.values(buckets).forEach((b) => {
      b.rate = b.requests ? Math.round((b.deals / b.requests) * 100) : 0;
    });

    return { days: Object.values(buckets) };
  }

  async teamPerformance(tenantId, query) {
    const range = this.parseRange(query);
    const dealFilter = {
      tenantId,
      status: 'won',
      $or: [
        { closedAt: { $gte: range.start, $lte: range.end } },
        { createdAt: { $gte: range.start, $lte: range.end } },
      ],
      ...(range.departmentId ? { departmentId: range.departmentId } : {}),
    };

    const taskFilter = {
      tenantId,
      status: 'done',
      updatedAt: { $gte: range.start, $lte: range.end },
      ...(range.departmentId ? { departmentId: range.departmentId } : {}),
    };

    const [wonDeals, doneTasks] = await Promise.all([
      this.dealModel.find(dealFilter).populate('assignedTo', 'name email').lean(),
      this.taskModel.find(taskFilter).populate('assignees', 'name email').lean(),
    ]);

    const byUser = {};

    for (const deal of wonDeals) {
      const user = deal.assignedTo;
      if (!user?._id) continue;
      const id = user._id.toString();
      if (!byUser[id]) {
        byUser[id] = { id, name: user.name || user.email, email: user.email, dealsWon: 0, revenue: 0, tasksDone: 0 };
      }
      byUser[id].dealsWon += 1;
      byUser[id].revenue += deal.value || 0;
    }

    for (const task of doneTasks) {
      const assignees = Array.isArray(task.assignees) ? task.assignees : [];
      for (const user of assignees) {
        if (!user?._id) continue;
        const id = user._id.toString();
        if (!byUser[id]) {
          byUser[id] = { id, name: user.name || user.email, email: user.email, dealsWon: 0, revenue: 0, tasksDone: 0 };
        }
        byUser[id].tasksDone += 1;
      }
    }

    const members = Object.values(byUser).sort((a, b) => b.revenue - a.revenue || b.dealsWon - a.dealsWon);

    return {
      range: { start: range.start, end: range.end },
      members,
    };
  }

  async exportExcel(tenantId, query) {
    const [income, funnel, sources, conversion] = await Promise.all([
      this.incomeSummary(tenantId, query),
      this.salesFunnel(tenantId, query),
      this.leadSourcePerformance(tenantId, query),
      this.conversionSummary(tenantId, query),
    ]);

    const wb = new ExcelJS.Workbook();

    const incomeSheet = wb.addWorksheet('Income Summary');
    incomeSheet.addRow(['Month', 'Actual', 'Forecast']);
    income.months.forEach((m) => incomeSheet.addRow([m.month, m.actual, m.forecast]));

    const funnelSheet = wb.addWorksheet('Sales Funnel');
    funnelSheet.addRow(['Stage', 'Count', 'Percentage']);
    funnel.stages.forEach((s) => funnelSheet.addRow([s.stage, s.count, `${s.percentage}%`]));

    const sourceSheet = wb.addWorksheet('Lead Sources');
    sourceSheet.addRow(['Source', 'Leads', 'Converted', 'Rate']);
    sources.sources.forEach((s) =>
      sourceSheet.addRow([s.source, s.requests, s.converted, `${s.conversionRate}%`]),
    );

    const convSheet = wb.addWorksheet('Conversion');
    convSheet.addRow(['Date', 'Requests', 'Deals Won', 'Rate']);
    conversion.days.forEach((d) => convSheet.addRow([d.date, d.requests, d.deals, `${d.rate}%`]));

    const buffer = await wb.xlsx.writeBuffer();
    return {
      filename: `analytics-${tenantId}-${Date.now()}.xlsx`,
      buffer: Buffer.from(buffer),
    };
  }
}

module.exports = { AnalyticsService };
