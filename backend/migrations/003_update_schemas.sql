USE legal_advisor;

-- 1) Alter the `users` table
ALTER TABLE users 
ADD COLUMN user_id VARCHAR(36) AFTER id,
ADD COLUMN phone VARCHAR(20) AFTER full_name,
ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00 AFTER is_active,
ADD COLUMN preferred_language VARCHAR(20) DEFAULT 'en' AFTER wallet_balance,
ADD COLUMN avatar_url VARCHAR(500) AFTER preferred_language,
ADD COLUMN last_login_at TIMESTAMP NULL AFTER avatar_url,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Populate existing rows with a UUID
UPDATE users SET user_id = UUID() WHERE user_id IS NULL;

-- Create an index on the new user_id UUID column since it might be used for lookups
CREATE INDEX idx_user_uuid ON users(user_id);


-- 2) Alter the `appointments` table
ALTER TABLE appointments
ADD COLUMN appointment_id VARCHAR(36) AFTER id,
ADD COLUMN appointment_type ENUM('video', 'voice') DEFAULT 'video' AFTER advocate_id,
CHANGE COLUMN appointment_date scheduled_start_time TIMESTAMP NULL,
CHANGE COLUMN appointment_time scheduled_end_time TIMESTAMP NULL,
ADD COLUMN duration_minutes INT DEFAULT 0 AFTER scheduled_end_time,
ADD COLUMN appointment_notes TEXT AFTER duration_minutes,
ADD COLUMN practice_area VARCHAR(100) AFTER appointment_notes,
ADD COLUMN amount DECIMAL(10,2) DEFAULT 0.00 AFTER practice_area,
ADD COLUMN confirmation_number VARCHAR(20) AFTER amount;

-- Modify ENUM status to include 'in_progress', 'no_show'
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled';

-- Populate existing rows with a UUID
UPDATE appointments SET appointment_id = UUID() WHERE appointment_id IS NULL;

-- Create an index on the new appointment_id UUID column
CREATE INDEX idx_appt_uuid ON appointments(appointment_id);
