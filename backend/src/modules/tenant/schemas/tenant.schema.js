const { Schema } = require('mongoose');
const { PLANS, TENANT_STATUSES } = require('../../../common/constants/plans');

const PLAN_VALUES = [...new Set([PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.BUSINESS, PLANS.ENTERPRISE])];

const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    customDomain: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    plan: { type: String, enum: PLAN_VALUES, default: PLANS.STARTER },
    industry: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    taxSettings: { type: Schema.Types.Mixed, default: {} },
    branches: { type: [Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUSES),
      default: TENANT_STATUSES.TRIAL,
    },
    settings: { type: Schema.Types.Mixed, default: {} },
    defaultDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    billingPeriodEnd: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = { TenantSchema, TenantModelName: 'Tenant' };
