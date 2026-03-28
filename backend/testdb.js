const db = require('./src/config/db');

async function check() {
  try {
    const [users] = await db.query('SELECT user_id, username, is_active, role FROM users');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
