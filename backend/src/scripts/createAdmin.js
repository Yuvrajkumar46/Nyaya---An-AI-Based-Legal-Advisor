require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        // Hash the admin password
        const passwordPlain = process.env.ADMIN_PASSWORD || 'admin_secure_pass_123';
        const saltPattern = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(passwordPlain, saltPattern);

        console.log(`Generated bcrypt hash for password '${passwordPlain}':`);
        console.log(passwordHash);

        // Ensure users table exists 
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('user', 'advocate', 'admin') DEFAULT 'user',
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        // Create admin_audit_log
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                target_id INT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Create advocate verification columns if needed (assuming legal_professionals exists)
        // Ensure the legal_professionals table is there
        await pool.query(`
            CREATE TABLE IF NOT EXISTS legal_professionals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                practice_areas JSON,
                state VARCHAR(50),
                city VARCHAR(50),
                languages JSON,
                bio TEXT,
                experience_years INT,
                education TEXT,
                firm_name VARCHAR(100),
                bci_registration_number VARCHAR(50) UNIQUE,
                bar_council_state VARCHAR(50),
                registration_date DATE,
                registration_expiry DATE,
                hourly_rate DECIMAL(10, 2),
                availability_days JSON,
                availability_from TIME,
                availability_to TIME,
                verification_status ENUM('pending', 'verified', 'rejected', 'suspended') DEFAULT 'pending',
                internal_notes TEXT,
                avatar_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Check if admin exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', ['nyaya_admin']);

        if (existing.length > 0) {
            console.log(' nyaya_admin already exists. Updating password hash to ensure it matches .env');
            await pool.query(
                `UPDATE users SET password_hash = ? WHERE username = 'nyaya_admin'`,
                [passwordHash]
            );
        } else {
            console.log(' Inserting nyaya_admin into database...');
            await pool.query(`
                INSERT INTO users (
                    username,
                    full_name,
                    password_hash,
                    role,
                    is_verified,
                    is_active
                ) VALUES (
                    'nyaya_admin',
                    'Nyaya Administrator',
                    ?,
                    'admin',
                    TRUE,
                    TRUE
                );
            `, [passwordHash]);
        }

        console.log('✅ Admin creation/update successful.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
