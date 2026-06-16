const {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { AuthGuard } = require('@nestjs/passport');
const { IS_PUBLIC_KEY } = require('../decorators/public.decorator');
const { IS_SUPERADMIN_KEY } = require('../decorators/superadmin.decorator');
const { AuthService } = require('../../modules/auth/auth.service');
const { defineParamTypes } = require('../define-param-types');
const { canUsePlanModule, requiredPlanForApiPath } = require('../constants/plans');

@Injectable()
class TenantGuard extends AuthGuard('jwt') {
  reflector;
  authService;

  constructor(reflector, authService) {
    super();
    this.reflector = reflector;
    this.authService = authService;
  }

  async canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isSuperadminRoute = this.reflector.getAllAndOverride(IS_SUPERADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const jwtValid = await super.canActivate(context);
    if (!jwtValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (isSuperadminRoute) {
      if (!user?.isSuperadmin) {
        throw new ForbiddenException('Superadmin access required');
      }
      return true;
    }

    const tenantId = String(request.tenantId || user?.tenantId || '');
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    const hostTenantId = request.tenantId ? String(request.tenantId) : null;
    const tokenTenantId = user.tenantId ? String(user.tenantId) : null;
    if (hostTenantId && tokenTenantId && hostTenantId !== tokenTenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const path = request.originalUrl || request.url || '';
    const allowExpired =
      path.startsWith('/api/billing') ||
      path.startsWith('/api/auth/me') ||
      path.startsWith('/api/auth/my-tenants') ||
      path.startsWith('/api/auth/switch-tenant');
    const tenant = await this.authService.assertTenantActive(tenantId, user.id, { allowExpired });
    const requirement = requiredPlanForApiPath(path);
    if (!canUsePlanModule(tenant.plan, requirement.module)) {
      throw new ForbiddenException(
        `${requirement.module} requires the ${requirement.plan} plan. Upgrade your workspace to access this module.`,
      );
    }

    const membership = await this.authService.validateMembership(user.id, tenantId);
    if (!membership) {
      throw new ForbiddenException('You do not belong to this tenant');
    }

    request.tenantId = tenantId;
    request.user = {
      ...user,
      role: membership.role,
      tenantId,
      departmentId: membership.departmentId?.toString() || null,
      memberId: membership._id?.toString(),
    };
    return true;
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}

defineParamTypes(TenantGuard, Reflector, AuthService);

module.exports = { TenantGuard };
