-- Default super admin account for local development only.
-- Password: ChangeMe123!  (hash generated with PHP password_hash(), bcrypt)
-- IMPORTANT: Change this password or remove this seeder before any shared/production use.
INSERT INTO admins (name, email, password_hash, role) VALUES
('System Administrator', 'admin@gensan-service-navigator.local', '$2y$10$SqSMMO2K2XzNesaCblD2aek4yryYmsj1x51P9XUSr4UGM6BQ//MKm', 'super_admin');
