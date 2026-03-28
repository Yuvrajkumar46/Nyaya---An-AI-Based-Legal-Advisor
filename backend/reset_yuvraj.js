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
    const bcrypt = require('bcryptjs');
    const newHash = await bcrypt.hash('password123', 12);
    
    await sequelize.query(
        'UPDATE users SET password_hash = ? WHERE username = "yuvraj"', 
        { 
            replacements: [newHash],
            type: Sequelize.QueryTypes.UPDATE 
        }
    );
    console.log("Successfully updated password to 'password123' for 'yuvraj'.");
}

main().catch(console.error).finally(() => process.exit(0));
