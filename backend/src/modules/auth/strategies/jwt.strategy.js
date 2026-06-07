const { Injectable, UnauthorizedException } = require('@nestjs/common');
const { PassportStrategy } = require('@nestjs/passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const { ConfigService } = require('@nestjs/config');
const { defineParamTypes } = require('../../../common/define-param-types');

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  userModel;
  configService;

  constructor(configService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'dev-secret-change-me'),
    });
    this.configService = configService;
  }

  async validate(payload) {
    const user = await this.userModel.findById(payload.sub).lean();
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isSuperadmin: user.isSuperadmin,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}

defineParamTypes(JwtStrategy, ConfigService);

module.exports = { JwtStrategy };
