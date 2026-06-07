const { Controller, Post, Get, Bind, Body, Req } = require('@nestjs/common');
const { Public } = require('../../common/decorators/public.decorator');
const { AuthService } = require('./auth.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('auth')
class AuthController {
  authService;

  constructor(authService) {
    this.authService = authService;
  }

  @Public()
  @Post('register')
  @Bind(Body())
  register(body) {
    return this.authService.register(body);
  }

  @Public()
  @Post('signup')
  @Bind(Body())
  signup(body) {
    return this.authService.signup(body);
  }

  @Public()
  @Post('login')
  @Bind(Body())
  login(body) {
    return this.authService.login(body);
  }

  @Public()
  @Post('superadmin/login')
  @Bind(Body())
  superadminLogin(body) {
    return this.authService.superadminLogin(body);
  }

  @Public()
  @Post('discover-tenants')
  @Bind(Body())
  discoverTenants(body) {
    return this.authService.discoverTenants(body);
  }

  @Public()
  @Post('accept-invite')
  @Bind(Body())
  acceptInvite(body) {
    return this.authService.acceptInvite(body);
  }

  @Public()
  @Post('verify-email')
  @Bind(Body())
  verifyEmail(body) {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @Post('verify-otp')
  @Bind(Body())
  verifyOtp(body) {
    return this.authService.verifyOtp(body);
  }

  @Public()
  @Post('resend-verification')
  @Bind(Body())
  resendVerification(body) {
    return this.authService.resendVerification(body.email);
  }

  @Public()
  @Post('forgot-password')
  @Bind(Body())
  forgotPassword(body) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @Bind(Body())
  resetPassword(body) {
    return this.authService.resetPassword(body);
  }

  @Get('my-tenants')
  @Bind(Req())
  myTenants(req) {
    return this.authService.myTenants(req.user.id);
  }

  @Post('switch-tenant')
  @Bind(Body(), Req())
  switchTenant(body, req) {
    return this.authService.switchTenant(req.user.id, body.tenantId);
  }

  @Get('me')
  @Bind(Req())
  me(req) {
    return this.authService.getProfile(req.user.id, req.tenantId);
  }
}

defineParamTypes(AuthController, AuthService);

module.exports = { AuthController };
