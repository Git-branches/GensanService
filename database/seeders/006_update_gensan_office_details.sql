-- Office details for the General Santos City offices added in 005, from the sources noted on each update
-- (checked 2026-10-29). Offices stay unverified (is_verified = 0) until someone confirms the address and
-- hours with the office itself; the site labels them "Details not yet verified".
--
-- Pag-IBIG is left without an address: only old third-party listings were found, and they disagree on
-- the building. Safe to run more than once.

SET NAMES utf8mb4;

-- SSS branch list with coordinates, published by SSS (sss.gov.ph, Attachment-Branch-Coordinates-ITB-SSS-GOODS-2024-067.pdf).
UPDATE offices
SET address = 'SSS Bldg., Macar Highway', barangay = 'Labangal',
    latitude = 6.1063999842, longitude = 125.1507952876
WHERE name = 'SSS General Santos Branch';

-- PhilHealth Regional Offices Directory (philhealth.gov.ph/about_us/directory/), PRO XII.
UPDATE offices
SET address = 'JJM II Bldg., Pendatun Avenue', barangay = 'Dadiangas North',
    contact_number = '0920 580 3636', email = 'gensanlhio.pro12@philhealth.gov.ph'
WHERE name = 'PhilHealth Local Health Insurance Office – General Santos City';

-- PSA directory for Region XII and PSA Helpline (CRS outlet hours for General Santos).
UPDATE offices
SET address = 'E.J. Yomon Bldg., Santiago Boulevard', barangay = 'Lagao',
    contact_number = '(083) 552-2502', opening_hours = 'Monday to Friday, 8:00 AM – 4:00 PM'
WHERE name = 'PSA General Santos City Office';

-- City Mayor's Office – BPLD Citizen's Charter 2026: receiving window location.
UPDATE offices
SET address = 'Ground Floor, General Santos City Investment Action Center, City Hall Compound', barangay = 'Dadiangas East'
WHERE name = 'Business Permits and Licensing Division, City Mayor''s Office (City Hall)';
