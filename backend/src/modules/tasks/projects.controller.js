const { Controller, Get, Post, Bind, Body, Req, Param } = require('@nestjs/common');
const { ProjectsService } = require('./projects.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('projects')
class ProjectsController {
  projectsService;

  constructor(projectsService) {
    this.projectsService = projectsService;
  }

  @Get()
  @Bind(Req())
  list(req) {
    return this.projectsService.list(req.tenantId);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.projectsService.create(req.tenantId, req.user.id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.projectsService.findOne(req.tenantId, id);
  }
}

defineParamTypes(ProjectsController, ProjectsService);

module.exports = { ProjectsController };
