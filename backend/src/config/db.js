require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'legal_advisor',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'mysqlyo123',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('DB CONNECTED (Sequelize is online)');
  })
  .catch(err => {
    console.error('Sequelize Connection Error:', err);
  });

module.exports = sequelize;
