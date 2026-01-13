CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  current_status TEXT NOT NULL,
  applied_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_job_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);