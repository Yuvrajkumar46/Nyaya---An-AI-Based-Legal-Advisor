USE legal_advisor;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(500),
  ip_address VARCHAR(100),
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_audit_log (
  log_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT,
  username_attempted VARCHAR(50),
  status ENUM('success','failed','blocked') NOT NULL,
  failure_reason VARCHAR(100),
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_lockouts (
  lockout_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) NOT NULL UNIQUE,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_attempt_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calls (
  call_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  caller_id INT NOT NULL,
  advocate_id INT NOT NULL,
  call_type ENUM('voice','video') DEFAULT 'video',
  start_time TIMESTAMP NULL,
  end_time TIMESTAMP NULL,
  duration_seconds INT DEFAULT 0,
  call_status ENUM('initiated','ringing','connected','ended','failed') DEFAULT 'initiated',
  billing_amount DECIMAL(10,2) DEFAULT 0.00,
  recording_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  document_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  advocate_id INT,
  document_name VARCHAR(255) NOT NULL,
  document_type ENUM('Pleading','Evidence','Order','Correspondence','Other') DEFAULT 'Other',
  file_format ENUM('PDF','DOCX','JPG','PNG','TXT') DEFAULT 'PDF',
  file_size_bytes BIGINT,
  storage_path VARCHAR(500),
  file_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS legal_queries (
  query_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  query_text TEXT NOT NULL,
  practice_area ENUM('Criminal','Civil','Corporate','Family','Labour','Tax','IP','RealEstate'),
  language VARCHAR(20) DEFAULT 'en',
  response_text TEXT,
  disclaimer_accepted BOOLEAN DEFAULT FALSE,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS billing_transactions (
  transaction_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type ENUM('credit','debit') NOT NULL,
  description VARCHAR(255),
  payment_method VARCHAR(50),
  status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  razorpay_order_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('appointment','call','billing','system') DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_consents (
  consent_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL,
  consent_version VARCHAR(20) DEFAULT 'v1.0',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  log_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_id VARCHAR(36),
  target_type VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
