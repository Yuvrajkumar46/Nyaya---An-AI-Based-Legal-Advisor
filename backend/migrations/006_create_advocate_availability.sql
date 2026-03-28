-- Migration: create advocate_availability and advocate_blocked_dates tables
CREATE TABLE IF NOT EXISTS advocate_availability (
  availability_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  advocate_id VARCHAR(36) NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT DEFAULT 60,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advocate_id) REFERENCES advocates(advocate_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS advocate_blocked_dates (
  block_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  advocate_id VARCHAR(36) NOT NULL,
  blocked_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advocate_id) REFERENCES advocates(advocate_id) ON DELETE CASCADE
);
