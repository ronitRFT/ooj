const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  isValidRole,
};
