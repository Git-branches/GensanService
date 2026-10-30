-- Moves the original 7 categories to the 10 in the project specification. Web addresses (slugs) of existing
-- categories stay the same so old links keep working. Nothing is deleted: Social Security and Housing and
-- Pag-IBIG are hidden after their guides move to Taxation and Government Contributions.
-- Safe to run more than once.

SET NAMES utf8mb4;

UPDATE categories SET name = 'Civil Registration and Documents', description = 'Birth, marriage, and death certificates and related documents.', display_order = 1 WHERE slug = 'civil-registry';
UPDATE categories SET name = 'Government Identification', description = 'National ID, passport, and other identification documents.', display_order = 2 WHERE slug = 'identification-documents';
UPDATE categories SET name = 'Health and Social Services', description = 'PhilHealth and social services for residents.', display_order = 4 WHERE slug = 'health-insurance';
UPDATE categories SET name = 'Business and Permits', description = 'Local business registration and permits.', display_order = 5 WHERE slug = 'business-permits';
UPDATE categories SET name = 'Taxation and Government Contributions', description = 'BIR, SSS, and Pag-IBIG registration and contributions.', display_order = 8 WHERE slug = 'taxation';

INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Employment and Labor', 'employment-labor', 'Clearances and documents for job seekers and workers.', 'hard-hat', 3),
('Transportation and Licensing', 'transportation-licensing', 'Driver''s licenses and vehicle registration.', 'car', 6),
('Police and Public Safety', 'police-public-safety', 'Police clearance and public safety services.', 'shield', 7),
('Education', 'education', 'School records and education-related services.', 'graduation-cap', 9),
('Other Government Services', 'other-government-services', 'Services that do not fit the other categories.', 'landmark', 10)
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'taxation')
WHERE category_id IN (SELECT id FROM (SELECT id FROM categories WHERE slug IN ('social-security', 'housing-pagibig')) AS old);

UPDATE categories SET is_active = 0 WHERE slug IN ('social-security', 'housing-pagibig');
