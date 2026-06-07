const { Controller, Put, Bind, Body, Req } = require('@nestjs/common');
const { AuthService } = require('./auth.service');
const { defineParamTypes } = require('../../common/define-param-types');

@Controller('users')
class UsersController {
  authService;

  constructor(authService) {
    this.authService = authService;
  }

  @Put('profile')
  @Bind(Body(), Req())
  updateProfile(body, req) {
    return this.authService.updateProfile(req.user.id, req.tenantId, body);
  }
}

defineParamTypes(UsersController, AuthService);

module.exports = { UsersController };
