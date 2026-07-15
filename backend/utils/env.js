const WEAK_JWT_SECRETS = new Set([
  'change_this_secret_in_production',
  'secret',
  'jwt_secret',
  'your_jwt_secret',
]);

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function validateEnv() {
  const errors = [];

  const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'FRONTEND_URL'];
  for (const key of required) {
    if (!process.env[key] || !String(process.env[key]).trim()) {
      errors.push(`${key} is required`);
    }
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters');
    }
    if (isProduction() && WEAK_JWT_SECRETS.has(jwtSecret.toLowerCase())) {
      errors.push('JWT_SECRET must be changed from the default value in production');
    }
  }

  if (isProduction()) {
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPassword || adminPassword === 'admin123') {
      errors.push('ADMIN_PASSWORD must be set to a strong value in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { validateEnv, isProduction };
