-- Adds the PNP's General Santos City offices and service guides to the existing PNP agency record.
--
-- Checked on 2026-11-02. GSCPO and seven police stations come from their own Facebook pages, and the GSCPO
-- numbers also appear on the Sangguniang Panlungsod website. They are public but stay unverified, because nobody
-- has confirmed them with the offices. Police Stations 4, 5, and 8 had no official source, so they stay hidden.
-- Station 1 and 7 names leave out Pendatun and Fatima until a source confirms those locations.
-- No guide is linked to an office, because no official source says which stations handle each service.
--
-- Run after migrations through 020 and seeder 010. Safe to run more than once.

SET NAMES utf8mb4;

SET @pnp = (SELECT id FROM agencies WHERE slug = 'philippine-national-police');
SET @category = (SELECT id FROM categories WHERE slug = 'police-public-safety');
SET @checked_on = '2026-11-02';
SET @station_note = 'A police station under the General Santos City Police Office.';

-- ---------------------------------------------------------------------------
-- Agency
-- ---------------------------------------------------------------------------
UPDATE agencies
SET description = 'The national police force of the Philippines. In General Santos City, it operates through the General Santos City Police Office (GSCPO) and its police stations.',
    presence = 'physical_office'
WHERE id = @pnp;

-- ---------------------------------------------------------------------------
-- Offices
-- ---------------------------------------------------------------------------
INSERT INTO offices (agency_id, name, branch_type, description, address, barangay, city, province, contact_number, email, is_verified, is_active)
SELECT @pnp, source.name, source.branch_type, source.description, source.address, source.barangay,
       'General Santos City', 'South Cotabato', source.contact_number, source.email, 0, source.is_active
FROM (
    SELECT 'General Santos City Police Office (GSCPO)' AS name, 'main' AS branch_type,
           'The PNP''s city headquarters in General Santos City.' AS description,
           'Camp Fermin G. Lira Jr.' AS address, 'Dadiangas West' AS barangay,
           '0998 598 7207 / 0927 766 7822' AS contact_number, 'pcr_gscpo@yahoo.com' AS email, 1 AS is_active
    UNION ALL SELECT 'Police Station 1', NULL, @station_note, NULL, NULL, '0998 598 7208', NULL, 1
    UNION ALL SELECT 'Police Station 2 – Makar', NULL, @station_note, 'Makar', 'Labangal', '0918 921 3580', 'policestation22026@gmail.com', 1
    UNION ALL SELECT 'Police Station 3 – Lagao', NULL, @station_note, NULL, 'Lagao', '0998 598 7212', NULL, 1
    UNION ALL SELECT 'Police Station 4 – San Isidro', NULL, @station_note, NULL, NULL, NULL, NULL, 0
    UNION ALL SELECT 'Police Station 5 – Tambler', NULL, @station_note, NULL, NULL, NULL, NULL, 0
    UNION ALL SELECT 'Police Station 6 – Bula', NULL, @station_note, NULL, 'Bula', '0998 598 7218', 'pulisstasyonsays@yahoo.com', 1
    UNION ALL SELECT 'Police Station 7', NULL, @station_note, NULL, NULL, '0916 272 6009', 'ps7_gscpo@yahoo.com', 1
    UNION ALL SELECT 'Police Station 8 – Tinagacan', NULL, @station_note, NULL, NULL, NULL, NULL, 0
    UNION ALL SELECT 'Police Station 9 – Mabuhay', NULL, @station_note, 'Promiseland, Phase 2', 'Mabuhay', '0948 874 1661', 'ps9.gscpo@gmail.com', 1
    UNION ALL SELECT 'Police Station 10 – Calumpang', NULL, @station_note, 'Purok Emilliana', 'Calumpang', '0999 548 9244', 'ps10_gscpo@yahoo.com', 1
) AS source
WHERE NOT EXISTS (SELECT 1 FROM offices o WHERE o.agency_id = @pnp AND o.name = source.name);

-- ---------------------------------------------------------------------------
-- National Police Clearance: rewritten from the PNP's own tutorial and published
-- Sources: https://pnpclearance.ph/how_to_apply_v2.pdf and https://pnpclearance.ph/
-- ---------------------------------------------------------------------------
SET @clearance = (SELECT id FROM services WHERE slug = 'get-national-police-clearance');

UPDATE services
SET description = 'A National Police Clearance is applied for through the PNP''s national online system, pnpclearance.ph. You register, choose a police station and appointment date, and pay online. First-time applicants then go to that station for their photo, signature, and biometrics.',
    fee_description = 'PHP 150, plus a convenience fee that depends on how you pay. Free once for first-time job seekers with an FTJS Certification.',
    processing_time_description = NULL,
    status = 'published',
    published_at = COALESCE(published_at, NOW()),
    verification_status = 'verified',
    last_verified_at = @checked_on,
    next_review_at = '2027-05-01',
    verification_notes = 'Checked against the PNP tutorial How to Apply for a National Police Clearance and pnpclearance.ph on 2026-11-02. Corrected two valid IDs to one. Processing time is left blank because the only official figures found were for other police units. Applicants choose the station in the online system, so no GenSan station is linked.'
WHERE id = @clearance;

UPDATE service_requirements
SET requirement_text = 'One valid government-issued ID',
    notes = 'Present it at the police station on your appointment date.'
WHERE service_id = @clearance AND display_order = 1;

UPDATE service_requirements
SET requirement_text = 'Account on pnpclearance.ph',
    notes = 'You create this when you register. If you are renewing, use your existing account.'
WHERE service_id = @clearance AND display_order = 2;

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT @clearance, source.requirement_text, source.notes, source.is_optional, source.display_order
FROM (
    SELECT 'Proof of payment' AS requirement_text, 'Your Payment Confirmation Slip or Electronic Official Receipt.' AS notes, 0 AS is_optional, 3 AS display_order
    UNION ALL SELECT 'Appointment reference number', 'The system generates this when you save your appointment.', 0, 4
    UNION ALL SELECT 'First Time Job Seeker (FTJS) Certification', 'For first-time job seekers under RA 11261 only. Present it with your valid ID. The free clearance can be used once.', 1, 5
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_requirements r WHERE r.service_id = @clearance AND r.display_order = source.display_order);

INSERT INTO service_eligibility (service_id, condition_text, display_order)
SELECT @clearance, source.condition_text, source.display_order
FROM (
    SELECT 'First-time applicants must appear in person for their photo, electronic signature, and biometrics.' AS condition_text, 1 AS display_order
    UNION ALL SELECT 'If you completed a clearance in person within the last three years, you may renew without appearing.', 2
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_eligibility e WHERE e.service_id = @clearance AND e.display_order = source.display_order);

UPDATE service_steps
SET title = 'Register online',
    instructions = 'Go to pnpclearance.ph and click Register. If you already have an account, log in instead.'
WHERE service_id = @clearance AND step_number = 1;

UPDATE service_steps
SET title = 'Complete your profile',
    instructions = 'Click Edit Profile, complete your personal data, and save it. Then click Clearance Application.'
WHERE service_id = @clearance AND step_number = 2;

UPDATE service_steps
SET title = 'Choose your station and appointment',
    instructions = 'Select your purpose, appointment date, and preferred police station. Click Landbank, then Next, then Save Appointment. Keep the reference number.'
WHERE service_id = @clearance AND step_number = 3;

UPDATE service_steps
SET title = 'Pay online',
    instructions = 'Click the payment button to open the Landbank ePayment Portal. For GCash, PayMaya, 7-Eleven, or Bayad Center, select Cash Payment. Keep your proof of payment.'
WHERE service_id = @clearance AND step_number = 4;

UPDATE service_steps
SET title = 'Go to your selected police station',
    instructions = 'Present your valid ID, proof of payment, and reference number on your appointment date. Have your biometrics, picture, and signature taken, then wait for your name to be called.'
WHERE service_id = @clearance AND step_number = 5;

INSERT INTO service_steps (service_id, step_number, title, instructions)
SELECT @clearance, 6, 'If you are renewing',
       'Log in to your existing account and choose renewal with or without appearance. Without appearance, update your profile, upload a 2x2 picture and a selfie holding a valid government ID, then download the clearance from your account.'
WHERE NOT EXISTS (SELECT 1 FROM service_steps WHERE service_id = @clearance AND step_number = 6);

UPDATE service_sources
SET verified_at = @checked_on
WHERE service_id = @clearance AND url = 'https://pnpclearance.ph/';

DELETE FROM service_sources
WHERE service_id = @clearance AND url = 'https://www.penaranda.gov.ph/how-to-apply-national-police-clearance/';

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @clearance, 'PNP: How to Apply for a National Police Clearance', 'https://pnpclearance.ph/how_to_apply_v2.pdf', @checked_on
WHERE NOT EXISTS (SELECT 1 FROM service_sources WHERE service_id = @clearance AND url = 'https://pnpclearance.ph/how_to_apply_v2.pdf');

-- ---------------------------------------------------------------------------
-- New guides: drafts, because no current PNP charter could be read
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, status, verification_status, verification_notes)
SELECT @category, @pnp, source.title, source.slug, source.summary, source.description, source.search_keywords, 'draft', 'unverified', source.notes
FROM (
    SELECT 'Report an Incident to the Police (Police Blotter)' AS title,
           'report-an-incident-police-blotter' AS slug,
           'How a police station records your report, and the Incident Record Form you should receive.' AS summary,
           'Police stations record reports in the police blotter. Crime reports are also written on an Incident Record Form (IRF). This is handled at a police station, not online.' AS description,
           'blotter, police report, incident, irf, complaint, reklamo, pulis' AS search_keywords,
           'Written from PNP Memorandum Circular 2014-009, so confirm it still applies. Confirm with GSCPO which station takes a report, what to bring, any fee for a certified copy, and the processing time. Confirm the 911 line. Then link the right offices.' AS notes
    UNION ALL SELECT 'Report a Lost Document to the Police',
           'report-a-lost-document-to-the-police',
           'What to prepare before reporting a lost ID or document at a police station.',
           'Some offices may ask for a police report before replacing a lost document. Ask the office that issued it first, because each office sets its own requirements. The report is made at a police station.',
           'lost id, lost document, nawala, police report, affidavit of loss, blotter',
           'No official PNP procedure for lost documents could be read. The station steps follow PNP Memorandum Circular 2014-009. Confirm with GSCPO what to bring, whether an IRF or a blotter certification is issued for a loss, any fee, and the processing time.'
    UNION ALL SELECT 'Ask the Police for Assistance',
           'ask-the-police-for-assistance',
           'Who to call and where to go when you need police help in General Santos City.',
           'You can call PNP GenSan or go to a police station. At the station, the desk officer first attends to requests for police assistance.',
           'police assistance, tulong, pulis, hotline, 911, emergency',
           'The GenSan numbers come from the Sangguniang Panlungsod website, whose copyright line is dated 2022, and match the GSCPO Facebook page. Confirm they are current, confirm the 911 line, and confirm which assistance each station gives.'
) AS source
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.slug = source.slug);

SET @blotter = (SELECT id FROM services WHERE slug = 'report-an-incident-police-blotter');
SET @lost = (SELECT id FROM services WHERE slug = 'report-a-lost-document-to-the-police');
SET @assist = (SELECT id FROM services WHERE slug = 'ask-the-police-for-assistance');

INSERT INTO service_eligibility (service_id, condition_text, display_order)
SELECT source.service_id, source.condition_text, 1
FROM (
    SELECT @blotter AS service_id, 'You are a victim of, a witness to, or someone reporting an incident.' AS condition_text
    UNION ALL SELECT @lost, 'You lost an ID or document and need to report the loss.'
    UNION ALL SELECT @assist, 'You need help from the police in General Santos City.'
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_eligibility e WHERE e.service_id = source.service_id);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT source.service_id, source.requirement_text, source.notes, 0, source.display_order
FROM (
    SELECT @blotter AS service_id, 'Your personal details' AS requirement_text, 'The police record details about you as the person reporting.' AS notes, 1 AS display_order
    UNION ALL SELECT @blotter, 'Details of the incident', 'What happened, when, where, and anyone involved.', 2
    UNION ALL SELECT @lost, 'Details of the lost document', 'What you lost, and when and where you lost it.', 1
    UNION ALL SELECT @assist, 'Your location and what happened', 'Tell the police where you are and what help you need.', 1
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_requirements r WHERE r.service_id = source.service_id AND r.display_order = source.display_order);

INSERT INTO service_steps (service_id, step_number, title, instructions)
SELECT source.service_id, source.step_number, source.title, source.instructions
FROM (
    SELECT @blotter AS service_id, 1 AS step_number, 'Go to the desk officer' AS title, 'At the police station, tell the desk officer what happened. The officer records the entry number, date, your name, the place, and the nature of the incident.' AS instructions
    UNION ALL SELECT @blotter, 2, 'See the right officer', 'If the incident is a crime, the desk officer endorses you to the duty investigator. If not, the duty officer addresses your concern.'
    UNION ALL SELECT @blotter, 3, 'Review the details', 'For a crime report, you and the duty investigator review the details together. Tell them if anything needs correcting or adding.'
    UNION ALL SELECT @blotter, 4, 'Sign and keep your IRF', 'You and the duty investigator sign the Incident Record Form. The first copy is yours. It is your receipt and proof that your report was received.'
    UNION ALL SELECT @lost, 1, 'Ask the issuing office first', 'Ask the office that issued the document what it needs from you to replace it, and whether it requires a police report.'
    UNION ALL SELECT @lost, 2, 'Report it at a police station', 'Tell the desk officer what you lost. The officer records your report in the police blotter.'
    UNION ALL SELECT @lost, 3, 'See the right officer', 'If the loss involves a crime, such as a theft, the desk officer endorses you to the duty investigator. If not, the duty officer addresses your concern.'
    UNION ALL SELECT @assist, 1, 'Call for help', 'In an emergency, call 911. You can also call PNP GenSan at 0927-766-7822 or 0998-598-7207.'
    UNION ALL SELECT @assist, 2, 'Or go to a police station', 'See the PNP page on this site for General Santos City offices.'
    UNION ALL SELECT @assist, 3, 'Talk to the desk officer', 'The desk officer first attends to requests for police assistance and guides you to the right officer.'
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_steps st WHERE st.service_id = source.service_id AND st.step_number = source.step_number);

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT source.service_id, source.label, source.url, source.verified_at
FROM (
    SELECT @blotter AS service_id, 'PNP Memorandum Circular 2014-009 (Supreme Court E-Library)' AS label, 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/77425' AS url, @checked_on AS verified_at
    UNION ALL SELECT @lost, 'PNP Memorandum Circular 2014-009 (Supreme Court E-Library)', 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/77425', @checked_on
    UNION ALL SELECT @assist, 'PNP Memorandum Circular 2014-009 (Supreme Court E-Library)', 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/77425', @checked_on
    UNION ALL SELECT @assist, 'Sangguniang Panlungsod of General Santos: Hotlines', 'https://sp.gensantos.gov.ph/contact-us/', @checked_on
    UNION ALL SELECT @assist, 'GSCPO official Facebook page', 'https://www.facebook.com/GSCPO.PRO12/', @checked_on
) AS source
WHERE NOT EXISTS (SELECT 1 FROM service_sources ss WHERE ss.service_id = source.service_id AND ss.url = source.url);
