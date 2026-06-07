const { Schema } = require('mongoose');

const SystemSettingsSchema = new Schema(
  {
    key: { type: String, default: 'platform', unique: true },
    defaultPlan: { type: String, default: 'Starter' },
    featureFlags: {
      type: Schema.Types.Mixed,
      default: {
        massmail: true,
        voip: true,
        liveChat: true,
        webForms: true,
        customDomains: true,
        analytics: true,
      },
    },
    planPricing: {
      type: Schema.Types.Mixed,
      default: {
        Starter: { monthly: 0, yearly: 0 },
        Professional: { monthly: 29, yearly: 24 },
        Business: { monthly: 59, yearly: 49 },
        Enterprise: { monthly: 99, yearly: 79 },
      },
    },
  },
  { timestamps: true },
);

module.exports = { SystemSettingsSchema, SystemSettingsModelName: 'SystemSettings' };
