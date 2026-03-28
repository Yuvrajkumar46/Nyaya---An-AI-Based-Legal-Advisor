require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');
const { v4: uuidv4 } = require('uuid');

async function setupAdmin() {
  try {
    const password = 'admin_secure_pass_123';
    const hash = await bcrypt.hash(password, 12);
    const username = 'nyaya_admin';

    const { QueryTypes } = require('sequelize');

    // Check if user exists
    const existing = await db.query(
      'SELECT user_id FROM users WHERE username = :username',
      { replacements: { username }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      console.log('Admin user exists. Updating password...');
      await db.query(
        'UPDATE users SET password_hash = :hash, role = "admin", is_active = 1 WHERE username = :username',
        { replacements: { hash, username }, type: QueryTypes.UPDATE }
      );
      console.log('Admin password updated successfully.');
    } else {
      console.log('Admin user not found. Creating nyaya_admin...');
      const uid = uuidv4();
      await db.query(
        `INSERT INTO users (user_id, username, full_name, phone, email, password_hash, role, is_active, wallet_balance, created_at)
         VALUES (:uid, :username, 'Nyaya Administrator', '+91-0000000000', 'admin@nyaya.local', :hash, 'admin', 1, 0, NOW())`,
        { replacements: { uid, username, hash }, type: QueryTypes.INSERT }
      );
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error setting up admin:', err);
    process.exit(1);
  }
}

setupAdmin();
