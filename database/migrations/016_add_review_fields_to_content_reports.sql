ALTER TABLE content_reports
    ADD COLUMN reporter_ip VARCHAR(45) DEFAULT NULL AFTER reporter_email,
    ADD COLUMN admin_note VARCHAR(1000) DEFAULT NULL AFTER status,
    ADD KEY idx_reports_ip_time (reporter_ip, created_at);
