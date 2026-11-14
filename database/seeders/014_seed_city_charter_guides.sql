-- Two City Government guides written from the City's Citizen's Charter: Business Permit Renewal and Health Certificate.
--
-- Read on 2026-11-05 from the charter PDFs linked on https://gensantos.gov.ph/?slug=citizen-s-charter.
-- Both guides are PUBLISHED but start unverified (the site owner asked for them on 2026-11-05), so residents see a
-- "Not yet verified" badge until someone confirms them. verification_notes lists what each guide still needs;
-- seeder 017 marks both verified after the charter check on 2026-11-12.
--
-- Run after migrations through 021 and seeders 005 and 010. Safe to run more than once: a guide that already
-- exists is left as it is.

SET NAMES utf8mb4;

SET @city = (SELECT id FROM agencies WHERE slug = 'city-government-of-general-santos');

-- ---------------------------------------------------------------------------
-- 1. BPLD: Renew a Business Permit
-- Source: https://hrmdo.gensantos.gov.ph/uploads/services/0c4d9ca97f626cc1d530042f76b9201d.pdf
--         (ISSUANCE OF BUSINESS PERMIT (RENEWAL) – EBOSS)
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, published_at, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'business-permits'),
    @city,
    'Renew a Business Permit',
    'renew-business-permit-general-santos',
    'How to renew your business (Mayor''s) permit in General Santos City online through Filipizen, from application to printing your permit.',
    'Every business in General Santos City renews its Mayor''s Permit and pays its business tax, under the city''s Revenue Code of 1996. The City''s charter says renewal is fully online all year round at www.filipizen.com, with General Santos City as the partner LGU. You pay online or at the City Treasurer''s Office, and the Business Permits and Licensing Division emails your electronic business permit as a PDF.',
    'business permit renewal, renew business permit, mayor''s permit, permit renewal, bpld, bplo, filipizen, negosyo',
    'Depends on your line of business, under the General Santos City Revenue Code of 1996. Your billing statement lists all taxes, fees, and charges.',
    'About 6 hours and 45 minutes of processing by the city, according to the City''s charter, not counting your own steps.',
    'published',
    NOW(),
    'The site owner says the BPLD takes walk-in business permit applications, but the charter describes online renewal only; ask the BPLD whether it takes walk-in renewals and how, then add it. Confirm the payment windows (City Hall 46 to 48, Investment Action Center 15 to 18) and the renewal deadline, which the charter does not state. Add the City Treasurer''s Office as an office after confirming its details.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'renew-business-permit-general-santos');

SET @service_id = (SELECT id FROM services WHERE slug = 'renew-business-permit-general-santos');
SET @fresh = NOT EXISTS (SELECT 1 FROM service_steps WHERE service_id = @service_id);

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices
WHERE @fresh AND name = 'Business Permits and Licensing Division, City Mayor''s Office (City Hall)';

INSERT INTO service_eligibility (service_id, condition_text, display_order)
SELECT @service_id, source.condition_text, source.display_order
FROM (
    SELECT 'You run a business, trade, or activity in General Santos City.' AS condition_text, 1 AS display_order
    UNION ALL SELECT 'Your business already has a business permit and a Business Identification Number (BIN).', 2
) AS source
WHERE @fresh;

INSERT INTO service_requirements (service_id, requirement_text, notes, linked_service_id, is_optional, display_order)
SELECT @service_id, source.requirement_text, source.notes,
       (SELECT id FROM services WHERE slug = source.linked_slug), source.is_optional, source.display_order
FROM (
    SELECT 'Active email address and mobile number' AS requirement_text,
           'Your electronic business permit and status updates are sent to your email.' AS notes,
           NULL AS linked_slug, 0 AS is_optional, 1 AS display_order
    UNION ALL SELECT 'Business Identification Number (BIN)', NULL, NULL, 0, 2
    UNION ALL SELECT 'Actual gross sales or receipts of the previous year',
           'If the amount you declare is wrong, the City Treasurer''s Office asks you to correct it within two days.', NULL, 0, 3
    UNION ALL SELECT 'Online banking, e-wallet, or credit/debit card details', 'For online payment through Filipizen.', NULL, 1, 4
    UNION ALL SELECT 'Billing statement and Tax Order of Payment (TOP) for your cedula',
           'For payment at the City Treasurer''s Office instead. You get the TOP for your cedula at the office.',
           'get-cedula-community-tax-certificate', 1, 5
) AS source
WHERE @fresh;

INSERT INTO service_steps (service_id, step_number, title, instructions)
SELECT @service_id, source.step_number, source.title, source.instructions
FROM (
    SELECT 1 AS step_number, 'Apply for renewal on Filipizen' AS title,
           'Go to www.filipizen.com, select General Santos City as the partner LGU, and click Go To Services. Choose Renew Business Application, fill in the required details, and submit.' AS instructions
    UNION ALL SELECT 2, 'Wait for approval for payment',
           'The Office of the Building Official and the City Treasurer''s Office assess your fees and business tax. You get an email when your application is approved for payment.'
    UNION ALL SELECT 3, 'View your billing statement',
           'On Filipizen, select General Santos City, click Go To Services, then choose Business Online Billing and Payment and fill in the required details.'
    UNION ALL SELECT 4, 'Pay online or at the City Treasurer''s Office',
           'Online: click Pay Option, choose the quarter or quarters to pay, click Confirm Payment, and pick a payment portal. Over the counter: go to the City Treasurer''s Office on the ground floor of City Hall or of the GSC Investment Action Center, get a queue number and the Tax Order of Payment for your cedula, and wait to be called. Present your billing statement and the TOP, pay in cash, manager''s check, or postal money order, and keep your Official Receipt.'
    UNION ALL SELECT 5, 'Download and print your permit',
           'The Business Permits and Licensing Division emails your electronic business permit as a PDF. Download it and print it. You can also have it delivered by courier, or in some cases have it printed, signed, and sealed at the Business Permits and Licensing Division.'
) AS source
WHERE @fresh;

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @service_id, source.label, source.url, NULL
FROM (
    SELECT 'City Government of General Santos: Issuance of Business Permit (Renewal), eBOSS' AS label,
           'https://hrmdo.gensantos.gov.ph/uploads/services/0c4d9ca97f626cc1d530042f76b9201d.pdf' AS url
    UNION ALL SELECT 'Filipizen: General Santos City', 'https://www.filipizen.com/partners/gensan_gensan'
) AS source
WHERE @fresh;

-- ---------------------------------------------------------------------------
-- 2. City Health Office: Get a Health Certificate (health card)
-- Source: https://hrmdo.gensantos.gov.ph/uploads/services/36fdbfb4b166374d39649228fca20b36.pdf
--         (Issuance of Health Certificate)
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, published_at, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'employment-labor'),
    @city,
    'Get a Health Certificate (Health Card)',
    'get-health-certificate-general-santos',
    'What to bring for a health card from the City Health Office, how much it costs, and how to apply as a walk-in or online.',
    'Workers in food and non-food businesses need a health certificate, also called a health card, under the Code on Sanitation of the Philippines (PD 856). In General Santos City it comes from the Public Health Laboratory of the City Health Office. You can walk in or book an appointment online. Expect to submit stool and urine samples, which the laboratory examines before printing your card.',
    'health certificate, health card, sanitary, food handler, cho, city health, trabaho, ojt',
    'Food handler: P150 new, P191 renewal. Non-food handler: P165 new, P206 renewal. OJT: P36. Change of company or card details: P46. Card replacement: P36.',
    'About 4 hours and 8 minutes, according to the City''s charter. Specimens are accepted from 8:00 am to 3:00 pm.',
    'published',
    NOW(),
    'Confirm the City Health Office and Public Health Laboratory address and hours, then add it as an office; the only address seen came from search results. Confirm how specimens should be collected and packed, which the charter does not say. Confirm whether choappointment.lgugensan.com is still the booking site.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE slug = 'get-health-certificate-general-santos');

SET @service_id = (SELECT id FROM services WHERE slug = 'get-health-certificate-general-santos');
SET @fresh = NOT EXISTS (SELECT 1 FROM service_steps WHERE service_id = @service_id);

INSERT INTO service_eligibility (service_id, condition_text, display_order)
SELECT @service_id, source.condition_text, source.display_order
FROM (
    SELECT 'You work, or will work, as a food handler in an establishment.' AS condition_text, 1 AS display_order
    UNION ALL SELECT 'You work, or will work, in a non-food establishment.', 2
    UNION ALL SELECT 'You are a student on on-the-job training (OJT).', 3
) AS source
WHERE @fresh;

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT @service_id, source.requirement_text, source.notes, source.is_optional, source.display_order
FROM (
    SELECT 'Government-issued valid ID' AS requirement_text, NULL AS notes, 0 AS is_optional, 1 AS display_order
    UNION ALL SELECT 'Stool and urine specimens', 'Submitted at the laboratory from 8:00 am to 3:00 pm. Not needed if you are only changing company, editing card details, or replacing a card.', 0, 2
    UNION ALL SELECT 'School endorsement letter, for OJT applicants only', 'From your school.', 1, 3
    UNION ALL SELECT 'DSWD clearance, for applicants aged 18 and below', 'From the DSWD or the City Social Welfare and Development Office.', 1, 4
) AS source
WHERE @fresh;

INSERT INTO service_steps (service_id, step_number, title, instructions)
SELECT @service_id, source.step_number, source.title, source.instructions
FROM (
    SELECT 1 AS step_number, 'Get a queue number' AS title,
           'At the City Health Office, get a queue number and wait to be called. To apply online instead, register first at choappointment.lgugensan.com and show your appointment at the front desk.' AS instructions
    UNION ALL SELECT 2, 'Fill in the application form',
           'Staff give you the form. Walk-in applicants then go to the profiling lane; online applicants go straight to the cashier.'
    UNION ALL SELECT 3, 'Have your details encoded',
           'Walk-in applicants: present your form so staff can encode your details and take your photo. To change company or card details, do it within the year your card was issued; after that it counts as a renewal. For a replacement, give the date your card was issued.'
    UNION ALL SELECT 4, 'Pay the fee',
           'Pay at the cashier according to your category and keep your Official Receipt.'
    UNION ALL SELECT 5, 'Submit your specimens',
           'Bring your stool and urine specimens to the laboratory between 8:00 am and 3:00 pm. The laboratory takes about 3 hours to examine them. Companies sending workers as a batch get separate instructions.'
    UNION ALL SELECT 6, 'Get your health card',
           'The laboratory prints and signs your health card. If a result needs follow-up, you are referred to the Social Hygiene Clinic first, and the card is released after that.'
) AS source
WHERE @fresh;

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @service_id, source.label, source.url, NULL
FROM (
    SELECT 'City Health Office: Issuance of Health Certificate' AS label,
           'https://hrmdo.gensantos.gov.ph/uploads/services/36fdbfb4b166374d39649228fca20b36.pdf' AS url
    UNION ALL SELECT 'City Health Office online appointment', 'https://choappointment.lgugensan.com/'
) AS source
WHERE @fresh;

-- ---------------------------------------------------------------------------
-- 3. Cedula draft: note where the City Treasurer's Office is, from the renewal charter
-- ---------------------------------------------------------------------------
UPDATE services
SET verification_notes = 'Confirm the fee: the City''s charter says "refer to table below", but the table is not in the published page. A City listing for boat permits says a cedula can come from the Barangay Treasurer, and one for name changes says the Barangay Hall or City Hall; confirm this, then add the option. The business permit renewal charter places the City Treasurer''s Office on the ground floor of City Hall and of the GSC Investment Action Center; confirm both, then add them as offices.'
WHERE slug = 'get-cedula-community-tax-certificate'
  AND verification_notes NOT LIKE '%Investment Action Center%';
