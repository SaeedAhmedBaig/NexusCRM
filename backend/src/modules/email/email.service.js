const { Injectable, Logger } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { defineParamTypes } = require('../../common/define-param-types');
const {
  welcomeEmail,
  otpVerificationEmail,
  signupAckEmail,
  inviteEmail: inviteTemplate,
  resetPasswordEmail: resetTemplate,
  passwordChangedEmail,
  taskNotificationEmail,
  requestNotificationEmail,
  dealNotificationEmail,
  contactSalesEmail: contactSalesEmailTemplate,
  contactAckEmail: contactAckEmailTemplate,
} = require('./email-templates');

@Injectable()
class EmailService {
  configService;
  logger = new Logger(EmailService.name);

  constructor(configService) {
    this.configService = configService;
  }

  async send({ to, subject, html }) {
    const apiKey = this.configService.get('BREVO_API_KEY');
    const senderEmail = this.configService.get('BREVO_SENDER_EMAIL');
    const senderName = this.configService.get('BREVO_SENDER_NAME', 'NexusCRM');

    if (!apiKey || !senderEmail) {
      this.logger.warn(`Email skipped — set BREVO_API_KEY and BREVO_SENDER_EMAIL in backend/.env`);
      return { skipped: true };
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Brevo error (${res.status}): ${err}`);
      throw new Error('Failed to send email');
    }

    const result = await res.json();
    this.logger.log(`Email sent: "${subject}" → ${to} (messageId: ${result.messageId || 'ok'})`);
    return result;
  }

  inviteEmail({ to, tenantName, inviteUrl, role, invitedBy }) {
    return this.send({
      to,
      subject: `You're invited to ${tenantName}`,
      html: inviteTemplate({ tenantName, inviteUrl, role, invitedBy }),
    });
  }

  otpEmail({ to, name, otp, verifyUrl, expiresMinutes, tenantName }) {
    return this.send({
      to,
      subject: `${otp} is your NexusCRM verification code`,
      html: otpVerificationEmail({ name, otp, verifyUrl, expiresMinutes, tenantName }),
    });
  }

  signupAckEmail({ to, name, tenantName }) {
    return this.send({
      to,
      subject: `Your ${tenantName} workspace is being set up`,
      html: signupAckEmail({ name, tenantName }),
    });
  }

  welcomeEmail({ to, name, tenantName, loginUrl }) {
    return this.send({
      to,
      subject: `Welcome to ${tenantName} on NexusCRM`,
      html: welcomeEmail({ name, tenantName, loginUrl }),
    });
  }

  resetPasswordEmail({ to, name, resetUrl }) {
    return this.send({
      to,
      subject: 'Reset your NexusCRM password',
      html: resetTemplate({ name, resetUrl }),
    });
  }

  passwordChangedEmail({ to, name, loginUrl }) {
    return this.send({
      to,
      subject: 'Your NexusCRM password was changed',
      html: passwordChangedEmail({ name, loginUrl }),
    });
  }

  taskEmail({ to, name, action, taskTitle, taskUrl, actorName }) {
    return this.send({
      to,
      subject: `Task ${action}: ${taskTitle}`,
      html: taskNotificationEmail({ name, action, taskTitle, taskUrl, actorName }),
    });
  }

  requestEmail({ to, name, action, requestTitle, requestUrl, actorName }) {
    return this.send({
      to,
      subject: `Request ${action}: ${requestTitle}`,
      html: requestNotificationEmail({ name, action, requestTitle, requestUrl, actorName }),
    });
  }

  dealEmail({ to, name, action, dealTitle, dealUrl, value }) {
    return this.send({
      to,
      subject: `Deal ${action}: ${dealTitle}`,
      html: dealNotificationEmail({ name, action, dealTitle, dealUrl, value }),
    });
  }

  contactSalesEmail({ to, name, email, company, message, type, sourceUrl }) {
    const subject =
      type === 'demo'
        ? `Demo request from ${name}${company ? ` (${company})` : ''}`
        : `Contact form from ${name}`;
    return this.send({
      to,
      subject,
      html: contactSalesEmailTemplate({
        name,
        email,
        company,
        message,
        type,
        sourceUrl,
      }),
    });
  }

  contactAckEmail({ to, name, type }) {
    const appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    return this.send({
      to,
      subject: type === 'demo' ? 'Your NexusCRM demo request' : 'We received your message',
      html: contactAckEmailTemplate({ name, type, ctaUrl: appUrl }),
    });
  }
}

defineParamTypes(EmailService, ConfigService);

module.exports = { EmailService };
