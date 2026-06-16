const { Schema } = require('mongoose');

const PRODUCT_STATUSES = ['active', 'draft', 'archived'];

const ProductSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    type: { type: String, enum: ['one_time', 'recurring', 'service'], default: 'one_time' },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active', index: true },
    unitPrice: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    taxCode: { type: String, default: '' },
    billingPeriod: { type: String, enum: ['none', 'monthly', 'quarterly', 'yearly'], default: 'none' },
    isTaxable: { type: Boolean, default: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

ProductSchema.index({ tenantId: 1, sku: 1 });
ProductSchema.index({ tenantId: 1, name: 1 });
ProductSchema.index({ tenantId: 1, category: 1, status: 1 });

module.exports = { ProductSchema, ProductModelName: 'Product', PRODUCT_STATUSES };
