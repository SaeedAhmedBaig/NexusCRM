import { createMongoAbility } from '@casl/ability';

export function createAbilityFromRules(rules = []) {
  return createMongoAbility(rules);
}

export function canAccess(ability, action, subject) {
  return ability?.can(action, subject) ?? false;
}
