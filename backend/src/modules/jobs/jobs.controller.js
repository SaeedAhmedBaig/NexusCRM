const { Controller, Get, Post, Bind, Req, Body, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { JobsService } = require('./jobs.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canManageDataJobs } = require('../../common/policies/policy-handlers');

@Controller('jobs')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canManageDataJobs)
class JobsController {
  jobsService;

  constructor(jobsService) {
    this.jobsService = jobsService;
  }

  @Get('health')
  @Bind(Req())
  health(req) {
    return this.jobsService.health(req.tenantId);
  }

  @Post('lease-next')
  @Bind(Req(), Body())
  leaseNext(req, body = {}) {
    return this.jobsService.leaseNext(req.tenantId, body.workerId);
  }
}

defineParamTypes(JobsController, JobsService);

module.exports = { JobsController };
