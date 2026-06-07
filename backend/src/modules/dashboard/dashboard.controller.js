const { Controller, Get, Post, Bind, Body, Req, Query } = require('@nestjs/common');
const { DashboardService } = require('./dashboard.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('dashboard')
class DashboardController {
  dashboardService;

  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  @Get('widgets')
  @Bind(Req())
  widgets(req) {
    return this.dashboardService.getWidgets(req.tenantId, req.user.id, req.user.role);
  }

  @Get('recent-activity')
  @Bind(Req(), Query('limit'))
  recentActivity(req, limit) {
    const parsed = Math.min(parseInt(limit, 10) || 10, 50);
    return this.dashboardService.getRecentActivity(req.tenantId, parsed);
  }

  @Get('sales-trend')
  @Bind(Req())
  salesTrend(req) {
    return this.dashboardService.getSalesTrend(req.tenantId, 7);
  }

  @Post('requests')
  @Bind(Body(), Req())
  createRequest(body, req) {
    return this.dashboardService.createRequest(req.tenantId, req.user.id, body);
  }

  @Post('tasks')
  @Bind(Body(), Req())
  createTask(body, req) {
    return this.dashboardService.createTask(req.tenantId, req.user.id, body);
  }

  @Post('mass-mail')
  @Bind(Body(), Req())
  massMail(body, req) {
    return this.dashboardService.sendMassMail(req.tenantId, req.user.id, body);
  }
}

defineParamTypes(DashboardController, DashboardService);

module.exports = { DashboardController };
