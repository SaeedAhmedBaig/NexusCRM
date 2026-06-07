const { Schema } = require('mongoose');

const EmailAccountSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    provider: { type: String, enum: ['smtp', 'gmail', 'imap'], default: 'smtp' },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPasswordEnc: { type: String, default: '' },
    imapHost: { type: String, default: '' },
    imapPort: { type: Number, default: 993 },
    imapUser: { type: String, default: '' },
    imapPasswordEnc: { type: String, default: '' },
    oauthRefreshTokenEnc: { type: String, default: '' },
    oauthAccessTokenEnc: { type: String, default: '' },
    isMain: { type: Boolean, default: false },
    doMassmail: { type: Boolean, default: true },
    doImport: { type: Boolean, default: true },
    lastSyncAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

EmailAccountSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = { EmailAccountSchema, EmailAccountModelName: 'EmailAccount' };
