require('dotenv').config();
const db = require('./src/config/db');

async function alter() {
  try {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'advocate', 'admin', 'director') DEFAULT 'user'");
    console.log('Successfully altered users table.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to alter table:', err);
    process.exit(1);
  }
}
alter();
