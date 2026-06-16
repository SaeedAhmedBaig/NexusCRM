const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param, Res } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');

function createEntityController(route, ServiceClass) {
  @Controller(route)
  class GeneratedController {
    service;

    constructor(service) {
      this.service = service;
    }

    @Get()
    @Bind(Req(), Query())
    list(req, query) {
      return this.service.list(req.tenantId, query, req.user);
    }

    @Post()
    @Bind(Body(), Req())
    create(body, req) {
      return this.service.create(req.tenantId, req.user.id, body);
    }

    @Get(':id/download')
    @Bind(Req(), Param('id'), Res())
    async download(req, id, res) {
      const file = await this.service.download(req.tenantId, id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    }

    @Get(':id')
    @Bind(Req(), Param('id'))
    getOne(req, id) {
      return this.service.findOne(req.tenantId, id, req.user);
    }

    @Patch(':id')
    @Bind(Body(), Req(), Param('id'))
    update(body, req, id) {
      return this.service.update(req.tenantId, req.user.id, id, body);
    }

    @Delete(':id')
    @Bind(Req(), Param('id'))
    remove(req, id) {
      return this.service.remove(req.tenantId, req.user.id, id);
    }

    @Post(':id/run')
    @Bind(Req(), Param('id'), Body())
    run(req, id, body) {
      return this.service.run(req.tenantId, req.user.id, id, body);
    }

    @Post('bulk')
    @Bind(Body(), Req())
    bulk(body, req) {
      return this.service.bulk(req.tenantId, req.user.id, body);
    }
  }

  defineParamTypes(GeneratedController, ServiceClass);
  return GeneratedController;
}

module.exports = { createEntityController };
