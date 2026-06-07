const { Controller, Get, Patch, Bind, Body, Req, UseGuards } = require('@nestjs/common');
const crypto = require('crypto');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { Roles } = require('../../common/decorators/roles.decorator');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { ROLES } = require('../../common/constants/roles');
const { canManageSettings } = require('../../common/policies/policy-handlers');
const { defineParamTypes } = require('../../common/define-param-types');
const { NotFoundException } = require('@nestjs/common');

@Controller('tenants/lead-sources')
@UseGuards(RolesGuard, PoliciesGuard)
class LeadSourcesController {
  leadSourceModel;
  tenantModel;

  @Get()
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Req())
  async list(req) {
    const missing = await this.leadSourceModel.countDocuments({ tenantId: req.tenantId, embedToken: null });
    if (missing > 0) {
      const toUpdate = await this.leadSourceModel.find({ tenantId: req.tenantId, embedToken: null });
      for (const source of toUpdate) {
        source.embedToken = crypto.randomUUID();
        await source.save();
      }
    }
    const sources = await this.leadSourceModel.find({ tenantId: req.tenantId }).sort({ name: 1 }).lean();
    const appDomain = process.env.APP_DOMAIN || 'localhost';
    const protocol = appDomain === 'localhost' ? 'http' : 'https';
    const tenant = await this.tenantModel.findById(req.tenantId).lean();

    return sources.map((s) => ({
      id: s._id,
      name: s.name,
      embedToken: s.embedToken,
      isActive: s.isActive,
      isDefault: s.isDefault,
      formFields: s.formFields,
      departmentId: s.departmentId,
      embedUrl: s.embedToken
        ? `${protocol}://${tenant?.subdomain}.${appDomain}/embed/contact-form/${s.embedToken}`
        : null,
    }));
  }

  @Patch(':id')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageSettings)
  @Bind(Body(), Req())
  async update(body, req) {
    const source = await this.leadSourceModel.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!source) throw new NotFoundException('Lead source not found');

    if (body.name) source.name = body.name;
    if (body.formFields) source.formFields = body.formFields;
    if (body.departmentId !== undefined) source.departmentId = body.departmentId || null;
    if (body.isActive !== undefined) source.isActive = body.isActive;
    if (!source.embedToken) source.embedToken = crypto.randomUUID();

    await source.save();
    return source;
  }
}

defineParamTypes(LeadSourcesController);

module.exports = { LeadSourcesController };
