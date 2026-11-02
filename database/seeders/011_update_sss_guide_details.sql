-- Fills in the SSS guide's fee and processing time, and the General Santos branch hours, from official SSS
-- documents read on 2026-11-01. The guide stays Needs review and the office stays unverified, because someone
-- must confirm these details and set the status from the admin panel. Safe to run more than once.

SET NAMES utf8mb4;

SET @service_id = (SELECT id FROM services WHERE slug = 'apply-for-sss-number');

-- SSS Citizen's Charter 2026, 1st Edition: Online Application of SS number, with and without uploaded documents.
UPDATE services
SET fee_description = 'None for the online application.',
    processing_time_description = 'About 20 minutes online without uploading documents, or 2 working days with uploaded documents.',
    verification_notes = 'Fee and processing time come from the SSS Citizen''s Charter 2026, for the online application. Branch hours come from the SSS list as of January 2025, so confirm they still apply. The branch phone and email come from the SSS Branch Locator, read by the site owner on 2026-11-01.'
WHERE id = @service_id;

-- Hours: SSS Branches Business Hours as of January 2025. Phone and email: SSS Branch Locator.
UPDATE offices
SET opening_hours = 'Monday to Friday, 7:00 AM – 5:00 PM',
    contact_number = '(083) 554-5751',
    email = 'generalsantos@sss.gov.ph'
WHERE name = 'SSS General Santos Branch';

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @service_id, 'SSS Citizen''s Charter 2026, 1st Edition', 'https://www.sss.gov.ph/wp-content/uploads/2026/07/2026-SSS-Citizens-Charter-1st-Edition-External-Services.pdf', '2026-11-01'
WHERE NOT EXISTS (SELECT 1 FROM service_sources WHERE service_id = @service_id AND label = 'SSS Citizen''s Charter 2026, 1st Edition');

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @service_id, 'SSS Branches Business Hours as of January 2025', 'https://www.sss.gov.ph/news-and-updates/sss-branches-business-hours-as-of-january-2025/', '2026-11-01'
WHERE NOT EXISTS (SELECT 1 FROM service_sources WHERE service_id = @service_id AND label = 'SSS Branches Business Hours as of January 2025');

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @service_id, 'SSS Branch Locator', 'https://member.sss.gov.ph/member/sss/branchloc', '2026-11-01'
WHERE NOT EXISTS (SELECT 1 FROM service_sources WHERE service_id = @service_id AND label = 'SSS Branch Locator');
