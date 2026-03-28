require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('Connected to MySQL database to run migrations...');

        const migrations = [
            '005_add_documents.sql'
        ];

        for (const file of migrations) {
            console.log(`Running migration: ${file}...`);
            const filePath = path.join(__dirname, 'migrations', file);
            const sql = fs.readFileSync(filePath, 'utf8');
            await connection.query(sql);
            console.log(`Successfully ran ${file}!`);
        }

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
};

runMigrations();
