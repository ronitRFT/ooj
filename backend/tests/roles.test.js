const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ROLES, ALL_ROLES, isValidRole } = require('../utils/roles');
const { requireRole } = require('../middlewares/authMiddleware');

describe('roles util', () => {
  it('exposes the three system roles', () => {
    assert.deepEqual([...ALL_ROLES].sort(), ['admin', 'super_admin', 'volunteer']);
  });

  it('validates known roles', () => {
    assert.equal(isValidRole(ROLES.SUPER_ADMIN), true);
    assert.equal(isValidRole(ROLES.ADMIN), true);
    assert.equal(isValidRole(ROLES.VOLUNTEER), true);
  });

  it('rejects unknown roles', () => {
    assert.equal(isValidRole('root'), false);
    assert.equal(isValidRole(undefined), false);
    assert.equal(isValidRole(''), false);
  });
});

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('requireRole middleware', () => {
  it('calls next when role is allowed', () => {
    const req = { admin: { role: ROLES.SUPER_ADMIN } };
    const res = mockRes();
    let called = false;
    requireRole(ROLES.SUPER_ADMIN)(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(res.statusCode, null);
  });

  it('returns 403 when role is not allowed', () => {
    const req = { admin: { role: ROLES.VOLUNTEER } };
    const res = mockRes();
    let called = false;
    requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN)(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });

  it('returns 401 when no role present', () => {
    const req = {};
    const res = mockRes();
    requireRole(ROLES.ADMIN)(req, res, () => {});
    assert.equal(res.statusCode, 401);
  });
});
