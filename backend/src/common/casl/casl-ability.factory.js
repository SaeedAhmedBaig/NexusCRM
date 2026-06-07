const { Injectable } = require('@nestjs/common');
const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function parsePermission(permission) {
  const [action, subject] = String(permission).split(':');
  return { action, subject };
}

@Injectable()
class CaslAbilityFactory {
  createForMember(membership, group) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    const permissionSet = new Set([
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
