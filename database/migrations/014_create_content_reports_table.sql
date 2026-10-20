CREATE TABLE IF NOT EXISTS content_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    reported_by_user_id INT UNSIGNED DEFAULT NULL,
    reporter_email VARCHAR(150) DEFAULT NULL,
    reason VARCHAR(100) NOT NULL,
    message TEXT DEFAULT NULL,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    resolved_by INT UNSIGNED DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_user FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL,
    KEY idx_reports_service (service_id),
    KEY idx_reports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
