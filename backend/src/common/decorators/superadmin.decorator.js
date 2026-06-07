const { SetMetadata } = require('@nestjs/common');

const IS_SUPERADMIN_KEY = 'isSuperadmin';
const SuperadminOnly = () => SetMetadata(IS_SUPERADMIN_KEY, true);

module.exports = { IS_SUPERADMIN_KEY, SuperadminOnly };
