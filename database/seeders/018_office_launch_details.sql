-- Fills in office details from official sources so residents see real contact information at launch.
--
-- Sources read on 2026-11-16:
--   PhilHealth Directory of Offices  https://www.philhealth.gov.ph/about_us/directory/
--     Confirms the GenSan LHIO address, mobile number, and email. It states no office hours.
--   City Government office directory  https://kiosk.gensantos.gov.ph/
--     Gives the BPLD phone and email, and the City Health Office map coordinates. Its City Health
--     Office contact fields are placeholders ("CHO", "1", "@"), so they are not used.
--
-- Hours already recorded for PSA, SSS, and BIR come from the PSA Region XII directory, the SSS
-- Branch Locator (January 2025), and the BIR Citizen's Charter 2026. They are stored here as weekly
-- hours so the "Open now" badge can work, and those offices are marked verified against those
-- sources. This is a desk check of the recorded details, not a phone confirmation.
--
-- Still open: BPLD hours and its exact address (the city directory lists a temporary office at
-- Dadiangas West Central Elementary School, which conflicts with the charter's City Hall location),
-- PhilHealth hours, Pag-IBIG details, and the City Health Office address and hours.
--
-- Run after 013 and 017. Safe to run more than once.

SET NAMES utf8mb4;

SET @verified_on = '2026-11-16';
-- Monday to Friday, 1 = Monday and 7 = Sunday. Days left out are closed.
SET @weekdays_8_4 = '{"1":["08:00","16:00"],"2":["08:00","16:00"],"3":["08:00","16:00"],"4":["08:00","16:00"],"5":["08:00","16:00"]}';
SET @weekdays_8_5 = '{"1":["08:00","17:00"],"2":["08:00","17:00"],"3":["08:00","17:00"],"4":["08:00","17:00"],"5":["08:00","17:00"]}';
SET @weekdays_7_5 = '{"1":["07:00","17:00"],"2":["07:00","17:00"],"3":["07:00","17:00"],"4":["07:00","17:00"],"5":["07:00","17:00"]}';

-- ---------------------------------------------------------------------------
-- 1. PSA General Santos City Office
-- ---------------------------------------------------------------------------
UPDATE offices
SET weekly_hours = @weekdays_8_4,
    is_verified = 1,
    last_verified_at = @verified_on
WHERE name = 'PSA General Santos City Office';

-- ---------------------------------------------------------------------------
-- 2. SSS General Santos Branch
-- ---------------------------------------------------------------------------
UPDATE offices
SET weekly_hours = @weekdays_7_5,
    is_verified = 1,
    last_verified_at = @verified_on
WHERE name = 'SSS General Santos Branch';

-- ---------------------------------------------------------------------------
-- 3. BIR Revenue District Office - General Santos City
-- ---------------------------------------------------------------------------
UPDATE offices
SET opening_hours = 'Monday to Friday, 8:00 AM – 5:00 PM',
    weekly_hours = @weekdays_8_5,
    is_verified = 1,
    last_verified_at = @verified_on
WHERE name = 'BIR Revenue District Office – General Santos City';

-- ---------------------------------------------------------------------------
-- 4. PhilHealth Local Health Insurance Office - General Santos City
-- The directory confirms the address, mobile number, and email. It gives no hours, so weekly_hours
-- stays empty and the office shows as verified without an "Open now" badge.
-- ---------------------------------------------------------------------------
UPDATE offices
SET is_verified = 1,
    last_verified_at = @verified_on
WHERE name = 'PhilHealth Local Health Insurance Office – General Santos City';

-- ---------------------------------------------------------------------------
-- 5. Business Permits and Licensing Division
-- The phone and email come from the city directory. The office stays unverified because the
-- directory's address conflicts with the Citizen's Charter, and no hours are published.
-- ---------------------------------------------------------------------------
UPDATE offices
SET contact_number = '0951 828 1852',
    email = 'bpld.official@gensantos.gov.ph'
WHERE name = 'Business Permits and Licensing Division, City Mayor''s Office (City Hall)';

-- ---------------------------------------------------------------------------
-- 6. City Health Office
-- Added so the health certificate guide can point somewhere. The city directory supplies map
-- coordinates only; the address, phone, and hours are still unknown, so it stays unverified.
-- ---------------------------------------------------------------------------
INSERT INTO offices (agency_id, name, branch_type, description, city, province, latitude, longitude, is_verified, is_active)
SELECT a.id,
       'City Health Office – General Santos City',
       'main',
       'The city office that issues health certificates, runs public health programs, and handles sanitation permits.',
       'General Santos City',
       'South Cotabato',
       6.1274285,
       125.1853305,
       0,
       1
FROM agencies a
WHERE a.slug = 'city-government-of-general-santos'
  AND NOT EXISTS (SELECT 1 FROM offices o WHERE o.name = 'City Health Office – General Santos City');

SET @cho = (SELECT id FROM offices WHERE name = 'City Health Office – General Santos City' LIMIT 1);
SET @health = (SELECT id FROM services WHERE slug = 'get-health-certificate-general-santos');

INSERT INTO service_offices (service_id, office_id)
SELECT @health, @cho
WHERE @health IS NOT NULL
  AND @cho IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM service_offices WHERE service_id = @health AND office_id = @cho
  );

-- ---------------------------------------------------------------------------
-- 7. Agencies whose GenSan presence is now confirmed
-- ---------------------------------------------------------------------------
UPDATE agencies
SET verification_status = 'verified',
    last_verified_at = @verified_on,
    presence = 'physical_office'
WHERE slug IN (
    'philippine-statistics-authority',
    'social-security-system',
    'bureau-of-internal-revenue',
    'philhealth'
);
