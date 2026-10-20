CREATE TABLE IF NOT EXISTS services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    agency_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    summary VARCHAR(500) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    fee_description VARCHAR(255) DEFAULT NULL,
    processing_time_description VARCHAR(255) DEFAULT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    last_verified_at DATE DEFAULT NULL,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    published_at TIMESTAMP NULL DEFAULT NULL,
    archived_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_services_slug (slug),
    CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_services_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT,
    CONSTRAINT fk_services_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    CONSTRAINT fk_services_updated_by FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL,
    KEY idx_services_category (category_id),
    KEY idx_services_agency (agency_id),
    KEY idx_services_status (status),
    FULLTEXT KEY ftx_services_search (title, summary, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_offices (
    service_id INT UNSIGNED NOT NULL,
    office_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (service_id, office_id),
    CONSTRAINT fk_service_offices_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_offices_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
