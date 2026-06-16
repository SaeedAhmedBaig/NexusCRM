const { Controller, Get, Post, Patch, Delete, Bind, Body, Req, Query, Param } = require('@nestjs/common');
const { MetadataService } = require('./metadata.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('metadata')
class MetadataController {
  metadataService;

  constructor(metadataService) {
    this.metadataService = metadataService;
  }

  @Get('custom-fields')
  @Bind(Req(), Query())
  listCustomFields(req, query) {
    return this.metadataService.listCustomFields(req.tenantId, query);
  }

  @Post('custom-fields')
  @Bind(Body(), Req())
  createCustomField(body, req) {
    return this.metadataService.createCustomField(req.tenantId, req.user.id, body);
  }

  @Patch('custom-fields/:id')
  @Bind(Body(), Req(), Param('id'))
  updateCustomField(body, req, id) {
    return this.metadataService.updateCustomField(req.tenantId, req.user.id, id, body);
  }

  @Delete('custom-fields/:id')
  @Bind(Req(), Param('id'))
  removeCustomField(req, id) {
    return this.metadataService.removeCustomField(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(MetadataController, MetadataService);

module.exports = { MetadataController };
