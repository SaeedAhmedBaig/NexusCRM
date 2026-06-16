const { Injectable } = require('@nestjs/common');
const { AbilityBuilder, createMongoAbility } = require('@casl/ability');
const { DEFAULT_GROUP_TEMPLATES } = require('../constants/roles');

function parsePermission(permission) {
  const [action, subject] = String(permission).split(':');
  return { action, subject };
}

@Injectable()
class CaslAbilityFactory {
  createForMember(membership, group) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    const permissionSet = new Set([
      ...(DEFAULT_GROUP_TEMPLATES.find((template) => template.role === membership?.role)?.permissions || []),
      ...(group?.permissions || []),
      ...(membership?.permissions || []),
    ]);

    for (const permission of permissionSet) {
      const { action, subject } = parsePermission(permission);
      if (!action || !subject) continue;

      if (subject === 'all') {
        can(action, 'all');
      } else {
        can(action, subject);
      }
    }

    const ability = build();

    if (membership?.departmentId) {
      ability.departmentId = membership.departmentId.toString();
    }

    return ability;
  }

  serialize(ability) {
    return ability.rules;
  }
}

module.exports = { CaslAbilityFactory };
