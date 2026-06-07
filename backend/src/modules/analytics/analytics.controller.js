const { Controller, Get, Bind, Req, Query, Res, UseGuards } = require('@nestjs/common');
const { AnalyticsService } = require('./analytics.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canReadAnalytics } = require('../../common/policies/policy-handlers');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('analytics')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canReadAnalytics)
class AnalyticsController {
  analyticsService;

  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }

  @Get('income-summary')
  @Bind(Req(), Query())
  incomeSummary(req, query) {
    return this.analyticsService.incomeSummary(req.tenantId, query);
  }

  @Get('sales-funnel')
  @Bind(Req(), Query())
  salesFunnel(req, query) {
    return this.analyticsService.salesFunnel(req.tenantId, query);
  }

  @Get('lead-source-performance')
  @Bind(Req(), Query())
  leadSourcePerformance(req, query) {
    return this.analyticsService.leadSourcePerformance(req.tenantId, query);
  }

  @Get('conversion-summary')
  @Bind(Req(), Query())
  conversionSummary(req, query) {
    return this.analyticsService.conversionSummary(req.tenantId, query);
  }

  @Get('team-performance')
  @Bind(Req(), Query())
  teamPerformance(req, query) {
    return this.analyticsService.teamPerformance(req.tenantId, query);
  }

  @Get('export')
  @Bind(Req(), Query(), Res())
  async export(req, query, res) {
    const { filename, buffer } = await this.analyticsService.exportExcel(req.tenantId, query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}

defineParamTypes(AnalyticsController, AnalyticsService);

module.exports = { AnalyticsController };
