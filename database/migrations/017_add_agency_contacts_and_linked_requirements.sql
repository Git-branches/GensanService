-- 017: Agency contact details shown on agency pages, and an optional link from a checklist
-- requirement to the guide that explains how to get it (e.g. TIN guide -> barangay certificate guide).

ALTER TABLE agencies
    ADD COLUMN hotline VARCHAR(100) DEFAULT NULL AFTER official_website,
    ADD COLUMN email VARCHAR(150) DEFAULT NULL AFTER hotline,
    ADD COLUMN facebook_url VARCHAR(255) DEFAULT NULL AFTER email;

ALTER TABLE service_requirements
    ADD COLUMN linked_service_id INT UNSIGNED DEFAULT NULL AFTER notes,
    ADD CONSTRAINT fk_requirements_linked_service FOREIGN KEY (linked_service_id) REFERENCES services(id) ON DELETE SET NULL;
