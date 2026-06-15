const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');

function createCrmController(route, ServiceClass) {
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

    @Post('bulk')
    @Bind(Body(), Req())
    bulk(body, req) {
      return this.service.bulk(req.tenantId, req.user.id, body);
    }
  }

  defineParamTypes(GeneratedController, ServiceClass);
  return GeneratedController;
}

module.exports = { createCrmController };
