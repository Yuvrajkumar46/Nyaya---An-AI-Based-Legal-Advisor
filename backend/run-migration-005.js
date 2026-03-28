require('dotenv').config({ path: __dirname + '/.env' });
const sequelize = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        const sql = fs.readFileSync(__dirname + '/migrations/005_add_is_deleted_to_users.sql', 'utf8');
        await sequelize.query(sql);
        console.log('Migration 005 completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
