const { Schema } = require('mongoose');
const { ROLES } = require('../../../common/constants/roles');

const InvitationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

InvitationSchema.index({ tenantId: 1, email: 1, status: 1 });

module.exports = { InvitationSchema, InvitationModelName: 'Invitation' };
