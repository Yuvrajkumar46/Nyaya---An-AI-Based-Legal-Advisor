require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');
async function check() {
  const [res] = await db.query("SHOW COLUMNS FROM users LIKE 'role'");
  fs.writeFileSync('out_cols.txt', JSON.stringify(res, null, 2));
  process.exit(0);
}
check();
