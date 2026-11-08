-- 022: Life events, guide feedback, renewal reminders, public update notes, and weekly office hours.

-- A life event is an ordered list of steps for one situation, such as starting a business.
-- A step can point to a guide; a step without one shows its own title and note.
CREATE TABLE IF NOT EXISTS life_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL,
    summary VARCHAR(300) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    updated_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_life_events_slug (slug),
    KEY idx_life_events_status (status, display_order),
    CONSTRAINT fk_life_events_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS life_event_steps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    life_event_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    note VARCHAR(500) DEFAULT NULL,
    source_url VARCHAR(255) DEFAULT NULL,
    is_optional TINYINT(1) NOT NULL DEFAULT 0,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_life_event_steps_event FOREIGN KEY (life_event_id) REFERENCES life_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_life_event_steps_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    KEY idx_life_event_steps_event (life_event_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "Did this guide help?" answers, as one total per guide, day, answer, and reason.
-- No IP address, cookie, or visitor identifier is stored.
CREATE TABLE IF NOT EXISTS service_feedback_daily (
    service_id INT UNSIGNED NOT NULL,
    feedback_date DATE NOT NULL,
    helpful TINYINT(1) NOT NULL,
    reason ENUM('none', 'outdated', 'missing', 'unclear', 'other') NOT NULL DEFAULT 'none',
    answers INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, feedback_date, helpful, reason),
    KEY idx_feedback_date (feedback_date),
    CONSTRAINT fk_feedback_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shows a "Set a renewal reminder" button on guides for things that expire, such as a permit or card.
-- MySQL has no ADD COLUMN IF NOT EXISTS, so each change checks information_schema first and is safe
-- to run more than once.
SET @has_column := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'renewal_reminder'
);
SET @sql := IF(@has_column = 0,
    'ALTER TABLE services ADD COLUMN renewal_reminder TINYINT(1) NOT NULL DEFAULT 0 AFTER processing_time_description',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- A note for residents about a change, shown on the guide under "What changed".
-- change_summary stays an internal note for editors.
SET @has_column := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_revisions' AND COLUMN_NAME = 'public_note'
);
SET @sql := IF(@has_column = 0,
    'ALTER TABLE service_revisions ADD COLUMN public_note VARCHAR(255) DEFAULT NULL AFTER change_summary',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Regular weekly hours as JSON, e.g. {"1":["08:00","17:00"],...} with 1 = Monday and 7 = Sunday.
-- "Open now" is shown only for verified offices. opening_hours stays as the text residents read.
SET @has_column := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'weekly_hours'
);
SET @sql := IF(@has_column = 0,
    'ALTER TABLE offices ADD COLUMN weekly_hours VARCHAR(255) DEFAULT NULL AFTER opening_hours',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
