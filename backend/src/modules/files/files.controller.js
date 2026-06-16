const { Controller, Get, Post, Delete, Bind, Body, Req, Query, Param, Res, UseGuards } = require('@nestjs/common');
const { defineParamTypes } = require('../../common/define-param-types');
const { FilesService } = require('./files.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { canManageFiles } = require('../../common/policies/policy-handlers');

@Controller('files')
@UseGuards(RolesGuard, PoliciesGuard)
@CheckPolicies(canManageFiles)
class FilesController {
  filesService;

  constructor(filesService) {
    this.filesService = filesService;
  }

  @Get()
  @Bind(Req(), Query())
  list(req, query) {
    return this.filesService.list(req.tenantId, query);
  }

  @Post()
  @Bind(Body(), Req())
  create(body, req) {
    return this.filesService.createFromContent(req.tenantId, req.user.id, body);
  }

  @Get(':id/download')
  @Bind(Req(), Param('id'), Res())
  async download(req, id, res) {
    const file = await this.filesService.readFile(req.tenantId, id);
    await this.filesService.recordActivity(req.tenantId, req.user.id, 'downloaded', file.asset);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Length', file.buffer.length);
    res.send(file.buffer);
  }

  @Delete(':id')
  @Bind(Req(), Param('id'))
  remove(req, id) {
    return this.filesService.remove(req.tenantId, req.user.id, id);
  }
}

defineParamTypes(FilesController, FilesService);

module.exports = { FilesController };
