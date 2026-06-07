const { Controller, Get, Post, Patch, Bind, Body, Req, UseGuards } = require('@nestjs/common');
const { RbacService } = require('./rbac.service');
const { UsersService } = require('./users.service');
const { RolesGuard } = require('../../common/guards/roles.guard');
const { PoliciesGuard } = require('../../common/guards/policies.guard');
const { Roles } = require('../../common/decorators/roles.decorator');
const { CheckPolicies } = require('../../common/decorators/check-policies.decorator');
const { ROLES } = require('../../common/constants/roles');
const {
  canManageUsers,
  canManageDepartments,
  canManageGroups,
} = require('../../common/policies/policy-handlers');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('tenants')
@UseGuards(RolesGuard, PoliciesGuard)
class RbacController {
  rbacService;
  usersService;

  constructor(rbacService, usersService) {
    this.rbacService = rbacService;
    this.usersService = usersService;
  }

  @Get('users')
  @Roles(ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER)
  @CheckPolicies(canManageUsers)
  @Bind(Req())
  async listUsers(req) {
    const departmentId = req.query?.departmentId;
    return this.usersService.listTenantUsers(req.tenantId, departmentId);
  }

  @Post('invite')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageUsers)
  @Bind(Body(), Req())
  async invite(body, req) {
    return this.usersService.inviteUser(req.tenantId, req.user.id, body);
  }

  @Patch('users/:memberId')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageUsers)
  @Bind(Body(), Req())
  async updateMember(body, req) {
    const memberId = req.params.memberId;
    return this.usersService.updateMember(req.tenantId, memberId, req.user.role, body);
  }

  @Post('users/:memberId/remove')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageUsers)
  @Bind(Req())
  async removeMember(req) {
    return this.usersService.removeMember(req.tenantId, req.params.memberId, req.user.role);
  }

  @Get('groups')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageGroups)
  @Bind(Req())
  listGroups(req) {
    return this.rbacService.listGroups(req.tenantId);
  }

  @Patch('groups/:groupId')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageGroups)
  @Bind(Body(), Req())
  updateGroup(body, req) {
    return this.rbacService.updateGroupPermissions(req.tenantId, req.params.groupId, body.permissions);
  }

  @Get('departments')
  @Bind(Req())
  listDepartments(req) {
    return this.rbacService.listDepartments(req.tenantId);
  }

  @Post('departments')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageDepartments)
  @Bind(Body(), Req())
  createDepartment(body, req) {
    return this.rbacService.createDepartment(req.tenantId, body);
  }

  @Patch('departments/:departmentId')
  @Roles(ROLES.OWNER, ROLES.ADMIN)
  @CheckPolicies(canManageDepartments)
  @Bind(Body(), Req())
  updateDepartment(body, req) {
    return this.rbacService.updateDepartment(req.tenantId, req.params.departmentId, body);
  }
}

defineParamTypes(RbacController, RbacService, UsersService);

module.exports = { RbacController };
