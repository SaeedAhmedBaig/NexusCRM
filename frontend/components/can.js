'use client';

import { createAbilityFromRules } from '../lib/ability';
import { getStoredRules } from '../lib/api';

export function Can({ action, subject, rules, children, fallback = null }) {
  const ability = createAbilityFromRules(rules || getStoredRules());
  return ability.can(action, subject) ? children : fallback;
}
