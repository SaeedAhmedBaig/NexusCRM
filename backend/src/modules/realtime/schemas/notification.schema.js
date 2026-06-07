const { Schema } = require('mongoose');

const NotificationSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    href: { type: String, default: null },
    entityType: { type: String, default: null },
    entityId: { type: Schema.Types.ObjectId, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ tenantId: 1, userId: 1, read: 1, createdAt: -1 });

module.exports = { NotificationSchema, NotificationModelName: 'Notification' };
