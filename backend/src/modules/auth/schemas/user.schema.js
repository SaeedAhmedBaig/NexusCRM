const { Schema } = require('mongoose');

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    isSuperadmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    emailVerificationOtpHash: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    avatarUrl: { type: String, default: null },
    language: { type: String, default: 'en' },
    preferences: {
      type: {
        emailNotifications: { type: Boolean, default: true },
        taskReminders: { type: Boolean, default: true },
        dealUpdates: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: false },
      },
      default: () => ({}),
    },
  },
  { timestamps: true },
);

module.exports = { UserSchema, UserModelName: 'User' };
