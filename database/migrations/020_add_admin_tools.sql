-- 020: Failed sign-ins in the activity log, agency verification, review notes, report resolutions, and notices.

-- A failed sign-in may use an email that belongs to no admin, so the log row has no admin.
ALTER TABLE admin_activity_logs
    MODIFY admin_id INT UNSIGNED DEFAULT NULL;

ALTER TABLE agencies
    ADD COLUMN verification_status ENUM('verified', 'needs_review', 'unverified', 'outdated') NOT NULL DEFAULT 'unverified' AFTER presence,
    ADD COLUMN last_verified_at DATE DEFAULT NULL AFTER verification_status;

-- Why a reviewer sent a guide back. Cleared when the guide is submitted again.
ALTER TABLE services
    ADD COLUMN review_note VARCHAR(500) DEFAULT NULL AFTER verification_notes;

ALTER TABLE content_reports
    ADD COLUMN resolution VARCHAR(1000) DEFAULT NULL AFTER admin_note;

-- Banners on the public site. full_page replaces the page with the notice during maintenance.
CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type ENUM('info', 'maintenance', 'emergency') NOT NULL DEFAULT 'info',
    full_page TINYINT(1) NOT NULL DEFAULT 0,
    starts_at DATETIME DEFAULT NULL,
    ends_at DATETIME DEFAULT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_admin FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    KEY idx_announcements_live (is_published, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
