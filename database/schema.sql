-- Andam GenSan — Database Schema
-- Engine: MySQL 8+ / MariaDB 10.4+
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Agencies (SSS, PhilHealth, Pag-IBIG, PSA, LGU offices, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    acronym VARCHAR(20) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    official_website VARCHAR(255) DEFAULT NULL,
    hotline VARCHAR(100) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    facebook_url VARCHAR(255) DEFAULT NULL,
    presence ENUM('physical_office', 'online_only', 'unconfirmed') NOT NULL DEFAULT 'unconfirmed',
    is_local_government TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_agencies_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Office branches under an agency
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    agency_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    branch_type ENUM('main', 'satellite') DEFAULT NULL,
    description VARCHAR(500) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    barangay VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'General Santos City',
    province VARCHAR(100) NOT NULL DEFAULT 'South Cotabato',
    contact_number VARCHAR(50) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    opening_hours VARCHAR(255) DEFAULT NULL,
    latitude DECIMAL(10,7) DEFAULT NULL,
    longitude DECIMAL(10,7) DEFAULT NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    last_verified_at DATE DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_offices_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    KEY idx_offices_agency (agency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Service categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Administrators (separate from public user accounts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'editor', 'reviewer') NOT NULL DEFAULT 'editor',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Service guides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    agency_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    summary VARCHAR(500) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    search_keywords VARCHAR(500) DEFAULT NULL,
    fee_description VARCHAR(255) DEFAULT NULL,
    processing_time_description VARCHAR(255) DEFAULT NULL,
    status ENUM('draft', 'for_review', 'approved', 'published', 'archived') NOT NULL DEFAULT 'draft',
    last_verified_at DATE DEFAULT NULL,
    verification_status ENUM('verified', 'needs_review', 'unverified', 'outdated') NOT NULL DEFAULT 'unverified',
    next_review_at DATE DEFAULT NULL,
    verification_notes VARCHAR(1000) DEFAULT NULL,
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
    KEY idx_services_next_review (next_review_at),
    FULLTEXT KEY ftx_services_search (title, summary, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A service may be offered at multiple office branches
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

CREATE TABLE IF NOT EXISTS faq_translations (
    faq_id INT UNSIGNED NOT NULL,
    locale VARCHAR(10) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    PRIMARY KEY (faq_id, locale),
    CONSTRAINT fk_faq_translations_faq FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_offices (
    service_id INT UNSIGNED NOT NULL,
    office_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (service_id, office_id),
    CONSTRAINT fk_service_offices_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_offices_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Eligibility conditions per service
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_eligibility (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    condition_text VARCHAR(500) NOT NULL,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eligibility_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    KEY idx_eligibility_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Document requirements (checklist items) per service
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requirements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    requirement_text VARCHAR(255) NOT NULL,
    notes VARCHAR(500) DEFAULT NULL,
    linked_service_id INT UNSIGNED DEFAULT NULL,
    is_optional TINYINT(1) NOT NULL DEFAULT 0,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_requirements_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_requirements_linked_service FOREIGN KEY (linked_service_id) REFERENCES services(id) ON DELETE SET NULL,
    KEY idx_requirements_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Application steps per service (ordered)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_steps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    step_number SMALLINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    instructions TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_steps_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY uq_steps_service_number (service_id, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Official source references per service (supports multiple sources)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_sources (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    label VARCHAR(150) DEFAULT NULL,
    url VARCHAR(255) NOT NULL,
    verified_at DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sources_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    KEY idx_sources_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Optional public user accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorited services per user
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, service_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved checklist progress per user, per service, per requirement item
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

-- ---------------------------------------------------------------------------
-- Administrator activity log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT UNSIGNED DEFAULT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    KEY idx_activity_logs_admin (admin_id),
    KEY idx_activity_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Reports of inaccurate or outdated information
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    reported_by_user_id INT UNSIGNED DEFAULT NULL,
    reporter_email VARCHAR(150) DEFAULT NULL,
    reporter_ip VARCHAR(45) DEFAULT NULL,
    reason VARCHAR(100) NOT NULL,
    message TEXT DEFAULT NULL,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    admin_note VARCHAR(1000) DEFAULT NULL,
    resolved_by INT UNSIGNED DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_user FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL,
    KEY idx_reports_service (service_id),
    KEY idx_reports_status (status),
    KEY idx_reports_ip_time (reporter_ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Administrator login attempts (brute-force protection)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    succeeded TINYINT(1) NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_login_attempts_email_time (email, attempted_at),
    KEY idx_login_attempts_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
