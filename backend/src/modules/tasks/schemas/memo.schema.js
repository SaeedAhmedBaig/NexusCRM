const { Schema } = require('mongoose');

const MEMO_STATUSES = ['draft', 'pending', 'reviewed', 'postponed'];

const MemoSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    status: { type: String, enum: MEMO_STATUSES, default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    convertedToType: { type: String, enum: ['task', 'project', null], default: null },
    convertedToId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

MemoSchema.index({ tenantId: 1, status: 1 });

module.exports = { MemoSchema, MemoModelName: 'Memo', MEMO_STATUSES };
