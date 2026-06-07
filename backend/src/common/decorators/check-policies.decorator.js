const { SetMetadata } = require('@nestjs/common');

const CHECK_POLICIES_KEY = 'checkPolicies';
const CheckPolicies = (...handlers) => SetMetadata(CHECK_POLICIES_KEY, handlers);

module.exports = { CHECK_POLICIES_KEY, CheckPolicies };
