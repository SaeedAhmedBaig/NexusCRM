const { Controller, Get, Bind, Req, Query, Res } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { Public } = require('../../common/decorators/public.decorator');
const { EmailAccountsService } = require('./email-accounts.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('auth/google')
class GoogleOAuthController {
  configService;
  emailAccountsService;

  constructor(configService, emailAccountsService) {
    this.configService = configService;
    this.emailAccountsService = emailAccountsService;
  }

  @Get()
  @Bind(Req(), Query('returnUrl'))
  startOAuth(req, returnUrl) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:4000/api/auth/google/callback',
    );

    if (!clientId) {
      return { error: 'GOOGLE_CLIENT_ID not configured', oauthUrl: null };
    }

    const state = Buffer.from(
      JSON.stringify({
        tenantId: req.tenantId,
        userId: req.user?.id,
        returnUrl: returnUrl || '/settings/email-accounts',
      }),
    ).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email openid',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return { oauthUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  }

  @Public()
  @Get('callback')
  @Bind(Query(), Res())
  async callback(query, res) {
    const frontendUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    let state = {};
    try {
      state = JSON.parse(Buffer.from(query.state || '', 'base64url').toString());
    } catch {
      return res.redirect(`${frontendUrl}/login?error=oauth_state`);
    }

    if (query.error) {
      return res.redirect(`${frontendUrl}${state.returnUrl || '/settings/email-accounts'}?error=${query.error}`);
    }

    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:4000/api/auth/google/callback',
    );

    if (!clientId || !clientSecret || !query.code) {
      return res.redirect(`${frontendUrl}${state.returnUrl || '/settings/email-accounts'}?error=oauth_config`);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: query.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}${state.returnUrl || '/settings/email-accounts'}?error=oauth_token`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    await this.emailAccountsService.createFromOAuth(state.tenantId, state.userId, {
      email: profile.email,
      name: profile.name || profile.email,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
    });

    return res.redirect(`${frontendUrl}${state.returnUrl || '/settings/email-accounts'}?connected=gmail`);
  }
}

defineParamTypes(GoogleOAuthController, ConfigService, EmailAccountsService);

module.exports = { GoogleOAuthController };
