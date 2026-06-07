const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { TasksService } = require('./tasks.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('tasks')
class TasksController {
  tasksService;

  constructor(tasksService) {
    this.tasksService = tasksService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.tasksService.list(req.tenantId, req.user.id, query);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.tasksService.create(req.tenantId, req.user.id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.tasksService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.tasksService.update(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/subtasks')
  @Bind(Body(), Req(), Param('id'))
  subtasks(body, req, id) {
    return this.tasksService.manageSubtasks(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/comments')
  @Bind(Body(), Req(), Param('id'))
  comment(body, req, id) {
    return this.tasksService.addComment(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/hide-for-me')
  @Bind(Req(), Param('id'))
  hideForMe(req, id) {
    return this.tasksService.toggleHideForMe(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(TasksController, TasksService);

module.exports = { TasksController };
