const {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} = require('@nestjs/common');
const { CaslAbilityFactory } = require('../../common/casl/casl-ability.factory');
const { DEFAULT_GROUP_TEMPLATES, ROLES } = require('../../common/constants/roles');
const { defineParamTypes } = require('../../common/define-param-types');

@Injectable()
class RbacService {
  groupModel;
  departmentModel;
  userTenantModel;
  caslAbilityFactory;

  constructor(caslAbilityFactory) {
    this.caslAbilityFactory = caslAbilityFactory;
  }

  async seedDefaultGroups(tenantId) {
    const existing = await this.groupModel.countDocuments({ tenantId });
    if (existing > 0) return;

    await this.groupModel.insertMany(
      DEFAULT_GROUP_TEMPLATES.map((template) => ({
        ...template,
        tenantId,
        isSystem: true,
      })),
    );
  }

  async findGroupByRole(tenantId, role) {
    return this.groupModel.findOne({ tenantId, role }).lean();
  }

  async getMembershipContext(userId, tenantId) {
    const membership = await this.userTenantModel
      .findOne({ userId, tenantId, isActive: true })
      .lean();

    if (!membership) {
      throw new ForbiddenException('Tenant membership not found');
    }

    let group = null;
    if (membership.groupId) {
      group = await this.groupModel.findById(membership.groupId).lean();
    } else {
      group = await this.findGroupByRole(tenantId, membership.role);
    }

    return { membership, group };
  }

  async getAbilityForUser(userId, tenantId) {
    const { membership, group } = await this.getMembershipContext(userId, tenantId);
    const ability = this.caslAbilityFactory.createForMember(membership, group);
    return {
      ability,
      rules: this.caslAbilityFactory.serialize(ability),
      membership,
      group,
    };
  }

  async listGroups(tenantId) {
    return this.groupModel.find({ tenantId }).sort({ name: 1 }).lean();
  }

  async listDepartments(tenantId) {
    return this.departmentModel.find({ tenantId }).sort({ name: 1 }).lean();
  }

  async createDepartment(tenantId, { name, groupId, description }) {
    if (!name) throw new BadRequestException('Department name is required');
    return this.departmentModel.create({ tenantId, name, groupId, description });
  }

  async updateDepartment(tenantId, departmentId, updates) {
    const dept = await this.departmentModel.findOne({ _id: departmentId, tenantId });
    if (!dept) throw new NotFoundException('Department not found');
    if (updates.name) dept.name = updates.name.trim();
    if (updates.description !== undefined) dept.description = updates.description;
    if (updates.groupId !== undefined) dept.groupId = updates.groupId || null;
    await dept.save();
    return dept;
  }

  async updateGroupPermissions(tenantId, groupId, permissions) {
    const group = await this.groupModel.findOne({ _id: groupId, tenantId });
    if (!group) throw new NotFoundException('Group not found');
    if (group.isSystem && group.role === ROLES.OWNER) {
      throw new ForbiddenException('Owner permissions cannot be modified');
    }
    group.permissions = permissions;
    await group.save();
    return group;
  }

  async deleteTenantData(tenantId) {
    await this.groupModel.deleteMany({ tenantId });
    await this.userTenantModel.deleteMany({ tenantId });
    await this.departmentModel.deleteMany({ tenantId });
  }
}

defineParamTypes(RbacService, CaslAbilityFactory);

module.exports = { RbacService };
