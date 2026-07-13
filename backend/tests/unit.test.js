const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { UUID_REGEX } = require('../middlewares/validateUuid');
const { validateEnv, isProduction } = require('../utils/env');

describe('validateUuid middleware', () => {
  it('accepts valid UUID v4', () => {
    assert.match('58d74ca1-5293-40f0-b459-fcced08d9a58', UUID_REGEX);
  });

  it('rejects invalid UUID', () => {
    assert.doesNotMatch('not-a-uuid', UUID_REGEX);
    assert.doesNotMatch('58d74ca1-5293-40f0-b459', UUID_REGEX);
  });
});

describe('environment helpers', () => {
  it('detects production mode from NODE_ENV', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.equal(isProduction(), true);
    process.env.NODE_ENV = 'development';
    assert.equal(isProduction(), false);
    process.env.NODE_ENV = original;
  });

  it('requires core environment variables', () => {
    const backup = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      JWT_SECRET: process.env.JWT_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL,
    };

    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'root';
    process.env.DB_NAME = 'ooj_events';
    process.env.JWT_SECRET = 'abcdefghijklmnopqrstuvwxyz012345';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    assert.doesNotThrow(() => validateEnv());

    delete process.env.FRONTEND_URL;
    assert.throws(() => validateEnv(), /FRONTEND_URL is required/);

    Object.assign(process.env, backup);
  });
});
