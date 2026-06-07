const { Controller, Get, Post, Patch, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { MemosService } = require('./memos.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('memos')
class MemosController {
  memosService;

  constructor(memosService) {
    this.memosService = memosService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.memosService.list(req.tenantId, req.user.id, query);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.memosService.create(req.tenantId, req.user.id, body);
  }

  @Get(':id')
  @Bind(Req(), Param('id'))
  getOne(req, id) {
    return this.memosService.findOne(req.tenantId, req.user.id, id);
  }

  @Patch(':id')
  @Bind(Body(), Req(), Param('id'))
  update(body, req, id) {
    return this.memosService.update(req.tenantId, req.user.id, id, body);
  }

  @Post(':id/review')
  @Bind(Req(), Param('id'))
  review(req, id) {
    return this.memosService.review(req.tenantId, req.user.id, id);
  }

  @Post(':id/convert-to-task')
  @Bind(Req(), Param('id'))
  convertToTask(req, id) {
    return this.memosService.convertToTask(req.tenantId, req.user.id, id);
  }

  @Post(':id/convert-to-project')
  @Bind(Req(), Param('id'))
  convertToProject(req, id) {
    return this.memosService.convertToProject(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(MemosController, MemosService);

module.exports = { MemosController };
