const { Controller, Get, Bind, Req, ForbiddenException } = require('@nestjs/common');

@Controller('tenant-data')
class TenantDataController {
  userTenantModel;

  @Get('members')
  @Bind(Req())
  async members(req) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const members = await this.userTenantModel
      .find({ tenantId })
      .populate('userId', 'email name')
      .lean();

    return {
      tenantId,
      members: members.map((m) => ({
        userId: m.userId?._id,
        email: m.userId?.email,
        name: m.userId?.name,
        role: m.role,
      })),
    };
  }
}

module.exports = { TenantDataController };
