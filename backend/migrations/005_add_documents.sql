USE legal_advisor;

CREATE TABLE IF NOT EXISTS document_sharing (
  sharing_id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  shared_by_user_id VARCHAR(36) NOT NULL,
  shared_with_advocate_id INT NOT NULL,
  access_level ENUM('view','view_download') DEFAULT 'view',
  share_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_versions (
  version_id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  version_number INT NOT NULL,
  storage_path VARCHAR(500),
  file_hash VARCHAR(255),
  file_size_bytes BIGINT,
  uploaded_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);
