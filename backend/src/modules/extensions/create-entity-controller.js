const { Controller, Get, Post, Bind, Body, Req, Query } = require('@nestjs/common');
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
