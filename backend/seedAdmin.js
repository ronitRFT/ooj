require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;
const SALT_ROUNDS = 10;

async function seedAdmin() {
  if (!USERNAME || !String(USERNAME).trim()) {
    console.error('ADMIN_USERNAME environment variable is required');
    process.exit(1);
  }

  if (!PASSWORD || !String(PASSWORD).trim()) {
    console.error('ADMIN_PASSWORD environment variable is required');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ooj_events',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  });

  try {
    console.log('Connected to MySQL');

    const [existing] = await connection.execute(
      'SELECT id FROM admins WHERE username = ?',
      [USERNAME]
    );

    if (existing.length > 0) {
      console.log(`Admin "${USERNAME}" already exists — skipping insert.`);
      return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    await connection.execute(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [USERNAME, passwordHash]
    );

    console.log(`Admin "${USERNAME}" created successfully.`);
  } finally {
    await connection.end();
  }
}

seedAdmin().catch((error) => {
  console.error('Failed to seed admin:', error.message);
  process.exit(1);
});
