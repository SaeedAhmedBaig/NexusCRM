const { Schema } = require('mongoose');

const RelatedEntitySchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    label: { type: String, default: null },
  },
  { _id: false },
);

const ActivityEventSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true, index: true },
    source: { type: String, default: 'app', index: true },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info', index: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityName: { type: String, default: null },
    summary: { type: String, required: true },
    href: { type: String, default: null },
    visibility: {
      type: String,
      enum: ['public', 'internal', 'private'],
      default: 'internal',
      index: true,
    },
    relatedEntities: { type: [RelatedEntitySchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ActivityEventSchema.index({ tenantId: 1, createdAt: -1 });
ActivityEventSchema.index({ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 });
ActivityEventSchema.index({ tenantId: 1, actorId: 1, createdAt: -1 });

module.exports = { ActivityEventSchema, ActivityEventModelName: 'ActivityEvent' };
