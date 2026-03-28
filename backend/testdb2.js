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

sequelize.query('SELECT user_id, username, is_active, role FROM users LIMIT 10', { type: Sequelize.QueryTypes.SELECT }).then((users) => {
    console.log(users);
}).catch(console.error).finally(() => process.exit(0));
