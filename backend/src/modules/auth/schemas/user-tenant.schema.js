const { Schema } = require('mongoose');
const { ROLES } = require('../../../common/constants/roles');

const UserTenantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CO_WORKER },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UserTenantSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
UserTenantSchema.index({ tenantId: 1 });
UserTenantSchema.index({ tenantId: 1, departmentId: 1 });

module.exports = { UserTenantSchema, UserTenantModelName: 'UserTenant' };
