const { Schema } = require('mongoose');
const { ROLES } = require('../../../common/constants/roles');

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

GroupSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

module.exports = { GroupSchema, GroupModelName: 'Group' };
