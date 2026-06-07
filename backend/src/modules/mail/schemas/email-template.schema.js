const { Schema } = require('mongoose');

const EmailTemplateSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = { EmailTemplateSchema, EmailTemplateModelName: 'EmailTemplate' };
