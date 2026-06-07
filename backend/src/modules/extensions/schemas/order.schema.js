const { Schema } = require('mongoose');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const OrderSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title: { type: String, required: true, trim: true },
    orderNumber: { type: String, trim: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    amount: { type: Number, default: 0 },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

OrderSchema.index({ tenantId: 1, status: 1 });

module.exports = { OrderSchema, OrderModelName: 'Order', ORDER_STATUSES };
