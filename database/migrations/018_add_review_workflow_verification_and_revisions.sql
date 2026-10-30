-- 018: Review workflow, verification status, version history, and related guides.

-- Draft -> For review -> Approved -> Published, enforced in Admin\ServiceController.
ALTER TABLE services
    MODIFY status ENUM('draft', 'for_review', 'approved', 'published', 'archived') NOT NULL DEFAULT 'draft',
    ADD COLUMN verification_status ENUM('verified', 'needs_review', 'unverified', 'outdated') NOT NULL DEFAULT 'unverified' AFTER last_verified_at,
    ADD COLUMN next_review_at DATE DEFAULT NULL AFTER verification_status,
    ADD COLUMN verification_notes VARCHAR(1000) DEFAULT NULL AFTER next_review_at,
    ADD KEY idx_services_next_review (next_review_at);

-- A date alone never proves a guide was confirmed, so nothing becomes "verified" here. Editors decide that.
UPDATE services SET verification_status = IF(last_verified_at IS NULL, 'unverified', 'needs_review');

-- Earlier versions of a guide. Each row holds the content as it was just before a change.
CREATE TABLE IF NOT EXISTS service_revisions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED DEFAULT NULL,
    snapshot LONGTEXT NOT NULL,
    change_summary VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_revisions_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_revisions_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    KEY idx_revisions_service (service_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_related (
    service_id INT UNSIGNED NOT NULL,
    related_service_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (service_id, related_service_id),
    CONSTRAINT fk_related_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_related_target FOREIGN KEY (related_service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
