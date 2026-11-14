-- Verifies the two published City Government guides against the City's Citizen's Charter.
--
-- Read on 2026-11-12:
--   Renew a Business Permit  https://hrmdo.gensantos.gov.ph/uploads/services/0c4d9ca97f626cc1d530042f76b9201d.pdf
--   Get a Health Certificate https://hrmdo.gensantos.gov.ph/uploads/services/36fdbfb4b166374d39649228fca20b36.pdf
-- Both charters match the guides' fees, requirements, steps, and processing times. The renewal guide gains
-- the charter's payment windows. The offices themselves stay unverified: the charters do not give the
-- address, phone, email, or office hours, and those still have to be confirmed with the offices.
--
-- Run after 014 and 016. Safe to run more than once.

SET NAMES utf8mb4;

SET @verified_on = '2026-11-12';
SET @next_review = '2027-05-12';

-- ---------------------------------------------------------------------------
-- 1. BPLD: Renew a Business Permit
-- ---------------------------------------------------------------------------
SET @renewal = (SELECT id FROM services WHERE slug = 'renew-business-permit-general-santos');

UPDATE services
SET verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the City Government''s Issuance of Business Permit (Renewal) charter and the Filipizen General Santos page on 2026-11-12. The charter confirms the requirements, steps, 6 hours and 45 minutes of city processing, and the payment windows: 46 to 48 at City Hall and 15 to 18 at the GSC Investment Action Center. It describes online renewal only and states no renewal deadline, so confirm with the BPLD whether it accepts walk-in renewals and when the deadline falls. The BPLD office stays unverified until its phone, email, and hours are confirmed.'
WHERE id = @renewal;

UPDATE service_steps
SET instructions = 'Online: click Pay Option, choose the quarter or quarters to pay, click Confirm Payment, and pick a payment portal. Over the counter: go to the City Treasurer''s Office on the ground floor of City Hall or of the GSC Investment Action Center, get a queue number and the Tax Order of Payment for your cedula, and wait to be called. At City Hall you pay at Windows 46 to 48; at the Investment Action Center, at Windows 15 to 18. Present your billing statement and the TOP, pay in cash, manager''s check, or postal money order, and keep your Official Receipt.'
WHERE service_id = @renewal AND step_number = 4;

UPDATE service_sources
SET verified_at = @verified_on
WHERE service_id = @renewal;

-- ---------------------------------------------------------------------------
-- 2. City Health Office: Get a Health Certificate (health card)
-- ---------------------------------------------------------------------------
SET @health = (SELECT id FROM services WHERE slug = 'get-health-certificate-general-santos');

UPDATE services
SET verification_status = 'verified',
    last_verified_at = @verified_on,
    next_review_at = @next_review,
    verification_notes = 'Checked against the City Health Office''s Issuance of Health Certificate charter on 2026-11-12. The charter confirms the fees, requirements, steps, 4 hours and 8 minutes of processing, and specimen acceptance from 8:00 am to 3:00 pm. The live booking site (choappointment.lgugensan.com) confirms online booking and says only 200 online and 50 walk-in appointments are accepted each day. The charter does not give the office address or office hours, or say how specimens should be collected and packed, so the City Health Office stays unverified until those are confirmed.'
WHERE id = @health;

UPDATE service_steps
SET instructions = 'At the City Health Office, get a queue number and wait to be called. To apply online instead, register first at choappointment.lgugensan.com and show your appointment at the front desk. The office accepts only 200 online and 50 walk-in appointments each day.'
WHERE service_id = @health AND step_number = 1;

UPDATE service_sources
SET verified_at = @verified_on
WHERE service_id = @health;
