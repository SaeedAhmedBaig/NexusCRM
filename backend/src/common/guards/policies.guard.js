const { Injectable, ForbiddenException } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { CHECK_POLICIES_KEY } = require('../decorators/check-policies.decorator');
const { CaslAbilityFactory } = require('../casl/casl-ability.factory');
const { RbacService } = require('../../modules/rbac/rbac.service');
const { defineParamTypes } = require('../define-param-types');

@Injectable()
class PoliciesGuard {
  reflector;
  rbacService;
  caslAbilityFactory;

  constructor(reflector, rbacService, caslAbilityFactory) {
    this.reflector = reflector;
    this.rbacService = rbacService;
    this.caslAbilityFactory = caslAbilityFactory;
  }

  async canActivate(context) {
    const policyHandlers = this.reflector.getAllAndOverride(CHECK_POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policyHandlers?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { membership, group } = await this.rbacService.getMembershipContext(
      request.user.id,
      request.tenantId,
    );

    const ability = this.caslAbilityFactory.createForMember(membership, group);
    request.ability = ability;

    const allowed = policyHandlers.every((handler) => handler(ability, request));
    if (!allowed) {
      throw new ForbiddenException('Action not permitted');
    }

    return true;
  }
}

defineParamTypes(PoliciesGuard, Reflector, RbacService, CaslAbilityFactory);

module.exports = { PoliciesGuard };
