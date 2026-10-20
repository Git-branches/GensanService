-- Sample published service guide: PSA Birth Certificate (PSA-authenticated copy)

-- Address, contact number, and hours are left empty until confirmed with PSA; the office stays unverified.
INSERT INTO offices (agency_id, name, address, barangay, contact_number, opening_hours, is_verified, last_verified_at)
SELECT id, 'PSA General Santos City Office', NULL, NULL, NULL, NULL, 0, NULL
FROM agencies WHERE slug = 'philippine-statistics-authority';

INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at, published_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'civil-registry'),
    (SELECT id FROM agencies WHERE slug = 'philippine-statistics-authority'),
    'Request a PSA Birth Certificate',
    'request-psa-birth-certificate',
    'How to request an authenticated copy of a birth certificate from the PSA.',
    'A PSA-authenticated birth certificate is often required for passport applications, employment, marriage, and other legal transactions. It can be requested online through PSA Serbilis/PSAHelpline.ph or in person at a PSA branch.',
    'Approximately PHP 365 per copy, excluding delivery fees (subject to change).',
    '3 to 8 working days for online requests, depending on delivery location.',
    'published',
    '2026-01-15',
    NOW();

SET @service_id = (SELECT id FROM services WHERE slug = 'request-psa-birth-certificate');
SET @office_id = (SELECT id FROM offices WHERE name = 'PSA General Santos City Office');

INSERT INTO service_offices (service_id, office_id) VALUES (@service_id, @office_id);

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'The requester is the document owner, an immediate family member, or an authorized representative.', 1),
(@service_id, 'The birth event is registered with the Philippine civil registry.', 2);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Valid government-issued ID of the requester', 'Required for identity verification.', 0, 1),
(@service_id, 'Completed PSA request form', 'Available online or at the PSA branch.', 0, 2),
(@service_id, 'Authorization letter and ID of the owner', 'Required only if requesting on behalf of someone else.', 1, 3);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Choose a request channel', 'Request online through PSA Serbilis or PSAHelpline.ph, or visit the PSA branch in person.'),
(@service_id, 2, 'Provide registrant details', 'Enter or state the full name, date of birth, and place of birth as recorded in the civil registry.'),
(@service_id, 3, 'Pay the applicable fee', 'Pay through the available online payment channels or over the counter.'),
(@service_id, 4, 'Receive the document', 'Wait for delivery by courier for online requests, or claim the printed copy at the branch.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'PSA Serbilis', 'https://psaserbilis.com.ph', '2026-01-15'),
(@service_id, 'PSA Official Website', 'https://psa.gov.ph', '2026-01-15');
