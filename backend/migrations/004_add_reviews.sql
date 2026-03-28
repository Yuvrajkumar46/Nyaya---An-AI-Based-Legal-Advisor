USE legal_advisor;

CREATE TABLE IF NOT EXISTS reviews (
  review_id VARCHAR(36) PRIMARY KEY,
  call_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  advocate_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
  FOREIGN KEY (call_id) REFERENCES calls(call_id) ON DELETE CASCADE
);
