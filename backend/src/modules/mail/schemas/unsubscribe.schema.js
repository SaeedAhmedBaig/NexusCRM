const { Schema } = require('mongoose');

const UnsubscribeSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: '' },
  },
  { timestamps: true },
);

UnsubscribeSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = { UnsubscribeSchema, UnsubscribeModelName: 'Unsubscribe' };
