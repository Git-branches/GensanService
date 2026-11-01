-- Four more guides: NBI Clearance, National Police Clearance, Barangay Clearance, and Cedula.
--
-- Written from official pages read on 2026-11-01 (see service_sources). Every guide is a DRAFT and stays
-- unverified, so residents cannot see it until someone confirms it and publishes it from the admin panel.
-- verification_notes lists what each guide still needs. No office is linked, because no address in
-- General Santos City was confirmed from an official source. Add offices from the admin panel.
--
-- Run after migrations through 020. Running it twice fails on the unique slugs, so it never creates duplicates.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Agencies
-- ---------------------------------------------------------------------------
INSERT INTO agencies (name, slug, acronym, official_website, presence, is_local_government, is_active) VALUES
('National Bureau of Investigation', 'national-bureau-of-investigation', 'NBI', 'https://nbi.gov.ph', 'unconfirmed', 0, 1),
('Philippine National Police', 'philippine-national-police', 'PNP', 'https://pnp.gov.ph', 'unconfirmed', 0, 1);

-- ---------------------------------------------------------------------------
-- 1. NBI: Get an NBI Clearance
-- Sources: https://nbi.gov.ph/citizens-charter/nbi-clearance-application/
--          https://nbi.gov.ph/citizens-charter/nbi-clearance-first-time-job-seekers/
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'police-public-safety'),
    (SELECT id FROM agencies WHERE slug = 'national-bureau-of-investigation'),
    'Get an NBI Clearance',
    'get-nbi-clearance',
    'What to bring for an NBI Clearance, and how to apply online or as a walk-in.',
    'An NBI Clearance is a certificate from the National Bureau of Investigation. You apply online or at an NBI clearance center, then go in person so NBI can take your photo, fingerprints, and signature. First-time job seekers can get theirs for free with a certification from their barangay.',
    'nbi, clearance, nbi clearance, job, employment, trabaho',
    'Not yet verified. The NBI charter lists P115, P165, and P415 without saying which applies to you. Free for first-time job seekers.',
    NULL,
    'draft',
    'Confirm which fee applies to whom: the charter lists P115, P165, and P415 with no labels. Confirm the NBI clearance center serving General Santos City, then add it as an office. The charter''s schedule and steps describe the Manila center. The first-time job seeker charter says a name match means returning on a scheduled date; confirm this applies to all applicants before adding it.';

SET @service_id = (SELECT id FROM services WHERE slug = 'get-nbi-clearance');

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'The NBI charter lists this service as open to the public.', 1);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Two valid government-issued IDs', NULL, 0, 1),
(@service_id, 'Barangay certification, for first-time job seekers only', 'It must be on barangay letterhead, dry sealed, and signed by the Punong Barangay or an authorized barangay officer.', 1, 2);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Apply', 'Apply online at clearance.nbi.gov.ph, or go to an NBI clearance center and have your details encoded there.'),
(@service_id, 2, 'Pay the fee', 'Pay online or over the counter. First-time job seekers do not pay.'),
(@service_id, 3, 'Have your biometrics taken', 'Go to the clearance center in person. NBI takes your fingerprints, photo, and signature.'),
(@service_id, 4, 'Get your clearance', 'Go to the printing area to receive your NBI Clearance.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'NBI: Citizen''s Charter, NBI Clearance Application', 'https://nbi.gov.ph/citizens-charter/nbi-clearance-application/', NULL),
(@service_id, 'NBI: Citizen''s Charter, First Time Job Seekers', 'https://nbi.gov.ph/citizens-charter/nbi-clearance-first-time-job-seekers/', NULL),
(@service_id, 'NBI Clearance online application', 'https://clearance.nbi.gov.ph/', NULL);

-- ---------------------------------------------------------------------------
-- 2. PNP: Get a National Police Clearance
-- Sources: https://pnpclearance.ph/
--          https://www.penaranda.gov.ph/how-to-apply-national-police-clearance/
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'police-public-safety'),
    (SELECT id FROM agencies WHERE slug = 'philippine-national-police'),
    'Get a National Police Clearance',
    'get-national-police-clearance',
    'How to register online, set an appointment, and what to bring to the police station.',
    'A National Police Clearance is applied for through the PNP''s online system, pnpclearance.ph. You register, set an appointment, and choose how to pay, then go to the police station so they can take your photo and fingerprints.',
    'police clearance, pulis, pnp, npc, clearance, job, trabaho',
    'Not yet verified. PNP guides list PHP 150, plus a fee that depends on how you pay.',
    NULL,
    'draft',
    'Confirm the fee: PHP 150 comes from a PNP guide and the 2024 NCRPO charter seen only in search results, because both pages failed to open. Confirm whether one or two IDs are needed; official pages disagree, so the guide asks for two. Confirm how long the clearance is valid (a municipal page says six months) and the free clearance for first-time job seekers under RA 11261. Add the General Santos police stations that take appointments.';

SET @service_id = (SELECT id FROM services WHERE slug = 'get-national-police-clearance');

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Two valid IDs', 'Originals, not photocopies, and not expired. Each must show your full name, a clear photo, and your signature.', 0, 1),
(@service_id, 'Account on pnpclearance.ph', 'You create this when you register.', 0, 2);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Register', 'Go to pnpclearance.ph and register for an account, then log in.'),
(@service_id, 2, 'Complete your application', 'Fill in your application information.'),
(@service_id, 3, 'Set an appointment', 'Choose your appointment.'),
(@service_id, 4, 'Choose how to pay', 'Select a payment option.'),
(@service_id, 5, 'Go to the police station', 'Bring your IDs on your appointment day. The station takes your photo and fingerprints.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'PNP National Police Clearance System', 'https://pnpclearance.ph/', NULL),
(@service_id, 'Municipality of Peñaranda: How to apply for a National Police Clearance', 'https://www.penaranda.gov.ph/how-to-apply-national-police-clearance/', NULL);

-- ---------------------------------------------------------------------------
-- 3. Barangay: Get a Barangay Clearance
-- Source: City Government of General Santos service listings that require a barangay clearance
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'other-government-services'),
    (SELECT id FROM agencies WHERE slug = 'city-government-of-general-santos'),
    'Get a Barangay Clearance',
    'get-barangay-clearance',
    'Where to get a barangay clearance in General Santos City.',
    'City Government services in General Santos City often ask for a barangay clearance. City service listings say to get it from the Barangay Treasurer at the barangay hall. Go to the barangay where you live, or, for a business, the barangay where it is located. Requirements and fees are set by each barangay, so ask at your barangay hall first.',
    'barangay clearance, brgy clearance, brgy, barangay',
    'Not yet verified. Ask your barangay hall.',
    NULL,
    'draft',
    'Do not publish yet. No official source for the barangay clearance procedure in General Santos City was found, because it is not in the City''s Citizen''s Charter. Ask a barangay hall for the requirements, fee, and processing time, then add them. An older City listing showed P500 for a business clearance, but the text was cut off, so it is left out.';

SET @service_id = (SELECT id FROM services WHERE slug = 'get-barangay-clearance');

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Go to the right barangay hall', 'Go to the barangay where you live. For a business, go to the barangay where it is located.'),
(@service_id, 2, 'Ask the Barangay Treasurer', 'Ask what you need to bring and how much it costs, since this is not yet confirmed here.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'City Government of General Santos: Citizen''s Charter', 'https://gensantos.gov.ph/?slug=citizen-s-charter', NULL);

-- ---------------------------------------------------------------------------
-- 4. City Treasurer: Get a Cedula
-- Source: https://hrmdo.gensantos.gov.ph/uploads/services/38344d921841db1d9874cff0b1257097.pdf
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description, processing_time_description, status, verification_notes)
SELECT
    (SELECT id FROM categories WHERE slug = 'taxation'),
    (SELECT id FROM agencies WHERE slug = 'city-government-of-general-santos'),
    'Get a Cedula (Community Tax Certificate)',
    'get-cedula-community-tax-certificate',
    'How to pay for a Cedula at the City Treasurer''s Office, and what to expect.',
    'A Cedula, or Community Tax Certificate, is issued when you pay your community tax. In General Santos City you get one from the Cash Receipts Division of the City Treasurer''s Office. Individuals and businesses can both apply.',
    'cedula, sedula, community tax certificate, ctc, residence certificate',
    'Not yet verified. The City Treasurer''s Office computes the amount when you apply.',
    'About 25 minutes, according to the City''s Citizen''s Charter.',
    'draft',
    'Confirm the fee: the City''s charter says "refer to table below", but the table is not in the published page. A City listing for boat permits says a cedula can come from the Barangay Treasurer, and one for name changes says the Barangay Hall or City Hall; confirm this, then add the option. Add the City Treasurer''s Office as an office after confirming its details.';

SET @service_id = (SELECT id FROM services WHERE slug = 'get-cedula-community-tax-certificate');

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'The City''s charter lists this service as open to citizens and business entities.', 1);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Tax Order of Payment (TOP), 1 copy', 'You get this form at the City Treasurer''s Office and fill it in there.', 0, 1);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Get a queue number and fill in the form', 'At the City Treasurer''s Office, get a priority number from the queuing machine and fill in the Tax Order of Payment. Staff compute the amount you need to pay. This takes about 15 minutes.'),
(@service_id, 2, 'Pay and get your Cedula', 'Give the Tax Order of Payment to the collector and pay. You receive your Cedula right there. This takes about 10 minutes.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'City Treasurer''s Office: Payment of Cedula/Community Tax Certificate', 'https://hrmdo.gensantos.gov.ph/uploads/services/38344d921841db1d9874cff0b1257097.pdf', NULL);
