-- Test-only super admin for the API suite and local development.
-- This file is NOT part of a production install: `database/seeders/*.sql` does not include this folder.
-- Password: LocalDev-Password-2026!
-- A production install creates its first admin with a freshly generated hash instead; see README.md.
INSERT INTO admins (name, email, password_hash, role, password_changed_at) VALUES
('System Administrator', 'admin@gensan-service-navigator.local', '$2y$10$.B0SW4VxObmM/HVac5bgcOVAK9emUZWdoYODj.dABmvyMMTlB7WXy', 'super_admin', NOW());
