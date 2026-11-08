-- Two life events, and renewal reminders on the guides for things that expire.
--
-- The order of each life event follows what the official requirements ask for, read on 2026-11-05:
--   BPLD Citizen's Charter 2026: new business permit and Mayor's Occupational Permit requirements
--   https://hrmdo.gensantos.gov.ph/uploads/services/6e3d973bfab34189221760fe39af68b1.pdf
--   City Health Office: Sanitary Permit to Operate (asks for the business permit and employees' health certificates)
--   https://hrmdo.gensantos.gov.ph/uploads/services/9f3287791b7f7300e9969bcab85da3cd.pdf
--   BPLD: Business Permit Renewal, eBOSS (cedula order of payment, barangay clearance charge)
--   https://hrmdo.gensantos.gov.ph/uploads/services/0c4d9ca97f626cc1d530042f76b9201d.pdf
-- Notes on steps that link to a guide repeat only what that guide already says.
--
-- Run after migration 022 and seeders 005, 010, and 014. Safe to run more than once.

SET NAMES utf8mb4;

SET @bpld_charter = 'https://hrmdo.gensantos.gov.ph/uploads/services/6e3d973bfab34189221760fe39af68b1.pdf';
SET @renewal_charter = 'https://hrmdo.gensantos.gov.ph/uploads/services/0c4d9ca97f626cc1d530042f76b9201d.pdf';
SET @sanitary_charter = 'https://hrmdo.gensantos.gov.ph/uploads/services/9f3287791b7f7300e9969bcab85da3cd.pdf';

-- ---------------------------------------------------------------------------
-- Renewal reminders
-- ---------------------------------------------------------------------------
UPDATE services SET renewal_reminder = 1
WHERE slug IN ('new-business-permit-general-santos', 'renew-business-permit-general-santos', 'get-health-certificate-general-santos');

-- ---------------------------------------------------------------------------
-- 1. Starting a business in General Santos City
-- ---------------------------------------------------------------------------
INSERT INTO life_events (title, slug, summary, description, status, display_order)
SELECT
    'Starting a business in General Santos City',
    'starting-a-business',
    'From registering your business name to your sanitary permit, in the order the City''s requirements build on each other.',
    'Each step links to its guide where there is one. Steps without a guide come from the City''s Citizen''s Charter, so check with the office before you go.',
    'published',
    1
WHERE NOT EXISTS (SELECT 1 FROM life_events WHERE slug = 'starting-a-business');

SET @event = (SELECT id FROM life_events WHERE slug = 'starting-a-business');
SET @fresh = NOT EXISTS (SELECT 1 FROM life_event_steps WHERE life_event_id = @event);

INSERT INTO life_event_steps (life_event_id, service_id, title, note, source_url, is_optional, display_order)
SELECT @event, (SELECT id FROM services WHERE slug = source.guide), source.title, source.note, source.source_url, 0, source.display_order
FROM (
    SELECT 1 AS display_order, NULL AS guide, 'Register your business with DTI, SEC, or CDA' AS title,
           'The City''s new business permit asks for proof of this registration.' AS note, @bpld_charter AS source_url
    UNION ALL SELECT 2, 'get-barangay-clearance', 'Get a barangay clearance',
           'The City''s sample list of business permit charges includes a barangay clearance. Its fee depends on the barangay.', @renewal_charter
    UNION ALL SELECT 3, NULL, 'Get a Fire Safety Inspection Certificate (FSIC)',
           'The new business permit asks for an FSIC for occupancy issued within the last 9 months. A new business may submit the fire safety inspection for new businesses instead.', @bpld_charter
    UNION ALL SELECT 4, 'new-business-permit-general-santos', 'Apply for your business permit',
           'Apply online through Filipizen.', NULL
    UNION ALL SELECT 5, 'get-cedula-community-tax-certificate', 'Pay your cedula with your permit',
           'If you pay at the City Treasurer''s Office, you get the Tax Order of Payment for your cedula there and pay it with your permit.', @renewal_charter
    UNION ALL SELECT 6, 'get-health-certificate-general-santos', 'Get health cards for your workers',
           'The sanitary permit asks for the health certificate of every employee.', @sanitary_charter
    UNION ALL SELECT 7, NULL, 'Get a sanitary permit to operate',
           'From the City Health Office. Bring a photocopy of your business permit, your employees'' health certificates, and a water analysis result if it applies to you. An inspector visits before the permit is issued.', @sanitary_charter
    UNION ALL SELECT 8, 'renew-business-permit-general-santos', 'Renew your business permit',
           'Renewal is online through Filipizen all year.', NULL
) AS source
WHERE @fresh;

-- ---------------------------------------------------------------------------
-- 2. Looking for work in General Santos City
-- ---------------------------------------------------------------------------
INSERT INTO life_events (title, slug, summary, description, status, display_order)
SELECT
    'Looking for work in General Santos City',
    'looking-for-work',
    'The documents for a Mayor''s Occupational Permit and the government numbers for a new job, starting with the ones later steps ask for.',
    'Not every employer asks for all of these, so ask yours what it needs. The occupational permit requirements come from the City''s Citizen''s Charter.',
    'published',
    2
WHERE NOT EXISTS (SELECT 1 FROM life_events WHERE slug = 'looking-for-work');

SET @event = (SELECT id FROM life_events WHERE slug = 'looking-for-work');
SET @fresh = NOT EXISTS (SELECT 1 FROM life_event_steps WHERE life_event_id = @event);

INSERT INTO life_event_steps (life_event_id, service_id, title, note, source_url, is_optional, display_order)
SELECT @event, (SELECT id FROM services WHERE slug = source.guide), source.title, source.note, source.source_url, source.is_optional, source.display_order
FROM (
    SELECT 1 AS display_order, 'request-psa-birth-certificate' AS guide, 'Get your PSA birth certificate' AS title,
           'The occupational permit asks for a birth, marriage, or baptismal certificate. SSS and PhilHealth registration also accept a birth certificate.' AS note,
           @bpld_charter AS source_url, 0 AS is_optional
    UNION ALL SELECT 2, NULL, 'First-time job seeker? Get a barangay certification',
           'With it, first-time job seekers get a free NBI clearance and one free police clearance, and the BIR accepts it for a TIN.',
           'https://nbi.gov.ph/citizens-charter/nbi-clearance-first-time-job-seekers/', 1
    UNION ALL SELECT 3, 'get-barangay-clearance', 'Get a barangay clearance',
           'From the barangay where you live. If you are not from General Santos City, the occupational permit also asks for one from the barangay where your workplace is.', @bpld_charter, 0
    UNION ALL SELECT 4, 'get-cedula-community-tax-certificate', 'Get your cedula',
           'The occupational permit asks for a Community Tax Certificate (cedula).', @bpld_charter, 0
    UNION ALL SELECT 5, 'get-national-police-clearance', 'Get a police or NBI clearance',
           'The occupational permit accepts either one.', @bpld_charter, 0
    UNION ALL SELECT 6, 'get-health-certificate-general-santos', 'Get a health card',
           'The occupational permit asks for a health card with its official receipt. The BPLD charter names George P. Royeca District Hospital in Lagao, while the City Health Office charter describes its own laboratory, so ask which one applies to you.', @bpld_charter, 0
    UNION ALL SELECT 7, NULL, 'Get a Mayor''s Occupational Permit',
           'From the Business Permits and Licensing Division, for anyone applying for local employment. Bring the documents above. The charter says it takes about 30 minutes.', @bpld_charter, 0
    UNION ALL SELECT 8, 'apply-for-tin-bir-form-1904', 'Get your TIN',
           'BIR Form 1904 is for first-time job seekers and others who need a TIN to deal with government offices.', NULL, 0
    UNION ALL SELECT 9, 'apply-for-sss-number', 'Get your SS number',
           'For employees, the self-employed, OFWs, and non-working spouses. You only apply once.', NULL, 0
    UNION ALL SELECT 10, 'register-as-philhealth-member', 'Register with PhilHealth',
           'If you are not yet a member.', NULL, 0
    UNION ALL SELECT 11, 'register-for-pag-ibig-membership', 'Register with Pag-IBIG',
           'For people who are employed, self-employed, not yet employed, or first-time job seekers and are not yet members.', NULL, 0
) AS source
WHERE @fresh;
