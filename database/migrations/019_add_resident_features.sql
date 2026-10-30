-- 019: Search keywords, agency and office details, anonymous view counts, and the FAQ.

ALTER TABLE services
    ADD COLUMN search_keywords VARCHAR(500) DEFAULT NULL AFTER description;

-- Unconfirmed by default: a national agency is not assumed to have an office in General Santos.
ALTER TABLE agencies
    ADD COLUMN presence ENUM('physical_office', 'online_only', 'unconfirmed') NOT NULL DEFAULT 'unconfirmed' AFTER facebook_url;

-- NULL means not stated, so no office is labeled a main branch by default.
ALTER TABLE offices
    ADD COLUMN branch_type ENUM('main', 'satellite') DEFAULT NULL AFTER name,
    ADD COLUMN description VARCHAR(500) DEFAULT NULL AFTER branch_type;

-- One total per guide per day. No IP address, cookie, or visitor identifier is stored.
CREATE TABLE IF NOT EXISTS service_daily_views (
    service_id INT UNSIGNED NOT NULL,
    view_date DATE NOT NULL,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, view_date),
    CONSTRAINT fk_daily_views_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    KEY idx_daily_views_date (view_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(30) NOT NULL,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_faqs_active (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per language. A question with no row for a language shows in English.
CREATE TABLE IF NOT EXISTS faq_translations (
    faq_id INT UNSIGNED NOT NULL,
    locale VARCHAR(10) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    PRIMARY KEY (faq_id, locale),
    CONSTRAINT fk_faq_translations_faq FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
