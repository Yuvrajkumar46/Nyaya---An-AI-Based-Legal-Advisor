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
    
    await sequelize.query(
        'UPDATE users SET password_hash = ? WHERE username = "yuvraj"', 
        { 
            replacements: ['$2b$12$nDZb6/z1iGUPteOmSs2PpOoz6vuDLfK3SdCXSp6XvJcE18wvXMpS.'],
            type: Sequelize.QueryTypes.UPDATE 
        }
    );
    console.log("Successfully restored original password hash for 'yuvraj'.");
}

main().catch(console.error).finally(() => process.exit(0));
