-- Records the check of the published guides against official sources on 2026-11-01. SSS, BIR, PhilHealth, the
-- City business permit, and PSA pass and are marked Verified, with corrections where the sources differed.
-- Pag-IBIG stays Unverified because its website could not be read. Offices are not changed: confirming them is a
-- separate step. Safe to run more than once.

SET NAMES utf8mb4;

SET @verified_on = '2026-11-01';
SET @next_review = '2027-04-30';

-- PSA: the guide listed a third-party price and channel, and allowed representatives at every channel.
-- Sources: PSA Serbilis Terms and Conditions, and PSA Serbilis FAQs.
SET @psa = (SELECT id FROM services WHERE slug = 'request-psa-birth-certificate');

UPDATE services
SET description = 'A PSA-authenticated birth certificate is often required for passport applications, employment, marriage, and other legal transactions. You can request it online through PSA Serbilis.',
    fee_description = 'PHP 330 per copy for delivery, including the delivery fee. PHP 155 per copy for pick-up at a PSA outlet.',
    processing_time_description = '6 to 8 working days after payment for delivery to General Santos City. Add 5 to 7 days if your area is outside the courier''s standard service area, and 10 to 15 working days if PSA must search for the record manually.',
    verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the PSA Serbilis Terms and Conditions and FAQs on 2026-11-01. Corrected the fee, delivery time, and who may request or claim a copy, and removed PSAHelpline because it is not a PSA channel. Walk-in requests at a PSA outlet are not described here because no official page could be read for them. The PSA website itself could not be read.'
WHERE id = @psa;

UPDATE service_requirements
SET requirement_text = 'Valid ID',
    notes = 'Have it ready when you receive your copy. PSA Memorandum Circular 2019-16 lists the accepted IDs.'
WHERE service_id = @psa AND display_order = 1;

UPDATE service_requirements
SET requirement_text = 'Completed online request form',
    notes = 'You fill it in on the PSA Serbilis website.'
WHERE service_id = @psa AND display_order = 2;

UPDATE service_requirements
SET requirement_text = 'Authorization letter or SPA, and valid IDs of the owner and representative',
    notes = 'Only if someone else receives the copy for the owner. The owner must sign it, and it must state the document, number of copies, and purpose. Not allowed for pick-up at a PSA outlet.'
WHERE service_id = @psa AND display_order = 3;

UPDATE service_steps
SET title = 'Choose how to get your copy',
    instructions = 'Request online through PSA Serbilis. Choose delivery to your address, pick-up at an LBC branch, or pick-up at a PSA outlet.'
WHERE service_id = @psa AND step_number = 1;

UPDATE service_steps
SET instructions = 'Enter the full name, date of birth, and place of birth as recorded in the civil registry.'
WHERE service_id = @psa AND step_number = 2;

UPDATE service_steps
SET title = 'Pay the fee',
    instructions = 'Pay online or through a PSA Serbilis payment channel. For pick-up at a PSA outlet, pay online or at the outlet.'
WHERE service_id = @psa AND step_number = 3;

UPDATE service_steps
SET title = 'Receive your copy',
    instructions = 'Wait for the courier or go to the LBC branch you chose. At a PSA outlet, the document owner must pay and claim in person. Representatives are not allowed.'
WHERE service_id = @psa AND step_number = 4;

UPDATE service_eligibility
SET condition_text = 'You are the document owner, their authorized representative, or their spouse, parent, direct descendant, or guardian if the owner is a minor.'
WHERE service_id = @psa AND display_order = 1;

UPDATE service_sources
SET label = 'PSA Serbilis Terms and Conditions', url = 'https://psaserbilis.com.ph/TermandCondition', verified_at = @verified_on
WHERE service_id = @psa AND label = 'PSA Serbilis';

INSERT INTO service_sources (service_id, label, url, verified_at)
SELECT @psa, 'PSA Serbilis FAQs', 'https://www.psaserbilis.com.ph/GetFaQs', @verified_on
WHERE NOT EXISTS (SELECT 1 FROM service_sources WHERE service_id = @psa AND label = 'PSA Serbilis FAQs');

UPDATE service_sources
SET verified_at = NULL
WHERE service_id = @psa AND label = 'PSA Official Website';

-- SSS: already matches the SSS Citizen's Charter 2026.
SET @sss = (SELECT id FROM services WHERE slug = 'apply-for-sss-number');

UPDATE services
SET verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the SSS Citizen''s Charter 2026, 1st Edition, on 2026-11-01. Branch hours come from the SSS list as of January 2025. The branch phone and email come from the SSS Branch Locator, read by the site owner on 2026-11-01.'
WHERE id = @sss;

-- BIR: matches the charter's E.O. 98 and ONETT entries. Adds the charter's alternative to an ID for succession.
SET @bir = (SELECT id FROM services WHERE slug = 'apply-for-tin-bir-form-1904');

UPDATE services
SET verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the BIR Citizen''s Charter 2026 on 2026-11-01: entries 4 (walk-in) and 5 (online) for E.O. 98 and one-time transactions. Added the documents for transfer of property by succession. Foreign nationals who are not residents have separate requirements in the charter.'
WHERE id = @bir;

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT @bir, 'Death certificate, extrajudicial settlement, or affidavit of self-adjudication', 'For transfer of property by succession, in place of the ID (1 photocopy, or a scanned copy online).', 1, 6
WHERE NOT EXISTS (SELECT 1 FROM service_requirements WHERE service_id = @bir AND display_order = 6);

UPDATE service_sources
SET verified_at = @verified_on
WHERE service_id = @bir;

-- PhilHealth: moves the guide from the 2023 charter to the 2026 handbook, which adds a registry-numbered
-- original and gives kasambahay their own forms.
SET @phic = (SELECT id FROM services WHERE slug = 'register-as-philhealth-member');

UPDATE services
SET processing_time_description = 'About 1 hour and 50 minutes at the office, including waiting time.',
    verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the PhilHealth Citizen''s Charter Handbook 2026, 1st Edition, pages 245 to 251, on 2026-11-01. The handbook lists both a photocopied ID or certificate and an original certificate with a registry number under requirements for all members, so ask the office if you have only one of them.'
WHERE id = @phic;

UPDATE service_requirements
SET notes = 'Download it from the PhilHealth website or get one at any PhilHealth office (1 original copy). Kasambahay use the Kasambahay Unified Registration Form (KURF) instead. Foreign nationals use the PMRF for Foreign Nationals.'
WHERE service_id = @phic AND display_order = 1;

UPDATE service_requirements
SET notes = 'Proof of your date of birth (1 photocopy). PhilHealth also lists a birth or baptismal certificate with a registry number (1 original copy), so bring it if you have one. Without these, a notarized affidavit of two disinterested persons stating your date of birth.'
WHERE service_id = @phic AND display_order = 2;

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT @phic, 'Household Employment Unified Report Form 2 (HEUR2)', 'For kasambahay: 2 original copies signed by your household employer.', 1, 7
WHERE NOT EXISTS (SELECT 1 FROM service_requirements WHERE service_id = @phic AND display_order = 7);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order)
SELECT @phic, 'Documents for other member types', 'Lifetime members, 4Ps or Listahanan members, and foreign nationals have other documents. Ask the PhilHealth office which apply to you.', 1, 8
WHERE NOT EXISTS (SELECT 1 FROM service_requirements WHERE service_id = @phic AND display_order = 8);

UPDATE service_sources
SET label = 'PhilHealth Citizen''s Charter Handbook 2026, 1st Edition', verified_at = @verified_on
WHERE service_id = @phic AND label = 'PhilHealth Citizen''s Charter 2026 (check for changes)';

DELETE FROM service_sources
WHERE service_id = @phic AND label = 'PhilHealth Citizen''s Charter 2023 (Enrollment of Members)';

-- Business permit: matches the charter. The time now separates online and over-the-counter payment.
SET @permit = (SELECT id FROM services WHERE slug = 'new-business-permit-general-santos');

UPDATE services
SET processing_time_description = 'About 4 hours and 40 minutes of city processing if you pay online, or about 7 hours and 10 minutes if you pay at the City Treasurer''s Office. Your own steps are not counted.',
    verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the BPLD Citizen''s Charter 2026, 1st Edition, Online Application for New Business Permit, on 2026-11-01. The 7 hours and 10 minutes is the charter total. The online figure adds the charter''s evaluation, assessment, and approval times.'
WHERE id = @permit;

UPDATE service_sources
SET verified_at = @verified_on
WHERE service_id = @permit;

-- Pag-IBIG: the official site refused automated reading, so nothing here could be checked.
UPDATE services
SET verification_notes = 'Not checked. pagibigfund.gov.ph could not be read on 2026-11-01, and no official registration requirements were found elsewhere. Compare the guide with the Member''s Data Form and the Pag-IBIG Citizen''s Charter, then fill in the fee and processing time.'
WHERE slug = 'register-for-pag-ibig-membership';
