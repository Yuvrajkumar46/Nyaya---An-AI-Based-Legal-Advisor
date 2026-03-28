require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,    
  }
);

async function main() {
    const users = await sequelize.query('SELECT user_id, username, is_active, role, password_hash FROM users WHERE username="yuvraj"', { type: Sequelize.QueryTypes.SELECT });

    const bcrypt = require('bcryptjs');
    if (users.length > 0) {
        const u = users[0];
        console.log("Testing dummy password AGAINST:", u.username);
        // Common passwords expected:
        const testPasswords = ['password123', 'admin123', 'test', 'yuvraj', 'yuvraj123'];
        for (let p of testPasswords) {
            const isValid = await bcrypt.compare(p, u.password_hash);
            console.log(`Password "${p}" is valid:`, isValid);
        }
    }
}
main().catch(console.error).finally(() => process.exit(0));
