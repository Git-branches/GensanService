CREATE TABLE IF NOT EXISTS user_checklist_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    requirement_id INT UNSIGNED NOT NULL,
    is_completed TINYINT(1) NOT NULL DEFAULT 0,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_progress_user_requirement (user_id, requirement_id),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_requirement FOREIGN KEY (requirement_id) REFERENCES service_requirements(id) ON DELETE CASCADE,
    KEY idx_progress_user_service (user_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
