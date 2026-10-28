-- Service guides for the General Santos City offices of SSS, BIR, PhilHealth, Pag-IBIG, and the City Government.
--
-- Written from each agency's official Citizen's Charter or website, checked on 2026-10-28 (see service_sources).
-- Every guide is inserted as a DRAFT: an editor should open each source, confirm the details, and publish it
-- from the admin panel. Offices stay unverified until their address and hours are confirmed with the office.
--
-- Run after 001-004. Running it twice fails on the unique service slugs, so it never creates duplicates.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Offices (unverified)
-- ---------------------------------------------------------------------------

-- Address, phone, and hours from the BIR Citizen's Charter 2026 (Revenue Region No. 18 directory).
INSERT INTO offices (agency_id, name, address, contact_number, opening_hours, is_verified)
SELECT id, 'BIR Revenue District Office – General Santos City',
       'BIR District Office Bldg, Pendatun Ave, Laurel cor. M. Roxas St',
       '(083) 552-2421 / (083) 552-1142', '8:00 AM – 5:00 PM', 0
FROM agencies WHERE slug = 'bureau-of-internal-revenue';

-- Addresses not yet confirmed from an official source; left empty until verified.
INSERT INTO offices (agency_id, name, is_verified)
SELECT id, 'SSS General Santos Branch', 0 FROM agencies WHERE slug = 'social-security-system';

INSERT INTO offices (agency_id, name, is_verified)
SELECT id, 'PhilHealth Local Health Insurance Office – General Santos City', 0 FROM agencies WHERE slug = 'philhealth';

INSERT INTO offices (agency_id, name, is_verified)
SELECT id, 'Pag-IBIG Fund General Santos Branch', 0 FROM agencies WHERE slug = 'pag-ibig-fund';

INSERT INTO offices (agency_id, name, is_verified)
SELECT id, 'Business Permits and Licensing Division, City Mayor''s Office (City Hall)', 0
FROM agencies WHERE slug = 'city-government-of-general-santos';

-- ---------------------------------------------------------------------------
-- 1. SSS: Apply for an SS Number
-- Source: https://www.sss.gov.ph/become-an-sss-member/
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'social-security'),
    (SELECT id FROM agencies WHERE slug = 'social-security-system'),
    'Apply for an SS Number',
    'apply-for-sss-number',
    'How to get your Social Security (SS) number online, and how to make it permanent so you can claim SSS benefits and loans.',
    'An SS number is your lifetime membership number with the Social Security System. You can apply for it online on the SSS website. A newly issued SS number is temporary: you can use it to pay contributions, but you must change it to permanent by presenting your PSA birth certificate or a primary ID before you can claim benefits or loans. Having an SS number does not by itself make you a covered member. Employees are covered once their employer reports them and pays at least one contribution; self-employed members, OFWs, and non-working spouses are covered once at least one contribution is paid.',
    NULL,
    'Your SS number is generated at the end of the online application and sent to your email.',
    'draft',
    '2026-10-28';

SET @service_id = (SELECT id FROM services WHERE slug = 'apply-for-sss-number');

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices WHERE name = 'SSS General Santos Branch';

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'You will work as an employee, are self-employed, are an overseas Filipino worker (OFW), or are a non-working spouse.', 1),
(@service_id, 'You do not have an SS number yet. SSS membership is for life, so you only apply once.', 2);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Active email address', 'SSS sends the activation link here. The link expires after 5 calendar days.', 0, 1),
(@service_id, 'Your personal details', 'Full name, date and place of birth, home address, civil status, and your height (cm) and weight (kg).', 0, 2),
(@service_id, 'Names and birth dates of your beneficiaries', 'Your father, spouse, children, or others, if applicable.', 1, 3),
(@service_id, 'Digital copy of a supporting document', 'A readable color JPEG or PDF up to 3 MB. You can skip this during the online application.', 1, 4),
(@service_id, 'PSA birth certificate, or a primary ID such as UMID, PhilID, passport, or driver''s license', 'Needed to change your SS number from temporary to permanent. Without a primary ID, SSS accepts any two IDs or documents, both with signature and at least one with photo.', 0, 5);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Start the online application', 'On the SSS website, open "Apply for an SS Number Online", read the procedure, and click Start. Fill in the Registrant Record Verification form and submit it.'),
(@service_id, 2, 'Open the link sent to your email', 'Open the link within 5 calendar days, because it expires after that. Check your spam folder if you cannot find it.'),
(@service_id, 3, 'Fill in your details', 'Enter your personal, contact, and address details, your civil status and place of birth, and your beneficiaries if you have any. Save each page before clicking Next.'),
(@service_id, 4, 'Generate your SS number', 'Choose a My.SSS user ID, enter your height and weight, review your entries, and click Generate SS Number. You may upload a supporting document or skip it.'),
(@service_id, 5, 'Keep the documents SSS emails you', 'You will receive your SS Number Slip, Transaction Number Slip, and E-1/E-6 form by email.'),
(@service_id, 6, 'Activate your My.SSS account', 'Use the activation link in the same email to set your password. It is valid for 30 calendar days.'),
(@service_id, 7, 'Make your SS number permanent', 'Submit or present your PSA birth certificate or a primary ID to SSS. Until then, your SS number can only be used to pay contributions. Call the SSS hotline 1455 to ask where to submit.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'SSS: Become an SSS Member', 'https://www.sss.gov.ph/become-an-sss-member/', '2026-10-28');

-- ---------------------------------------------------------------------------
-- 2. BIR: Apply for a TIN (BIR Form 1904)
-- Source: BIR Citizen's Charter 2026, Revenue District Office services 4 (walk-in) and 5 (ORUS)
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'taxation'),
    (SELECT id FROM agencies WHERE slug = 'bureau-of-internal-revenue'),
    'Apply for a TIN (BIR Form 1904)',
    'apply-for-tin-bir-form-1904',
    'How to get a Taxpayer Identification Number (TIN) from the BIR for a job application or a government transaction, online through ORUS or at the BIR office.',
    'Under Executive Order 98, people dealing with government offices must put their TIN on the forms, permits, licenses, and clearances they get from them. If you do not have a TIN yet, you apply using BIR Form 1904, either online through the BIR Online Registration and Update System (ORUS) or in person at the BIR Revenue District Office that covers where you live. First-time job seekers also submit a barangay certification. There is no processing fee.',
    'Free. The BIR charges no processing fee.',
    'About 3 days online through ORUS; about 6 hours walk-in, including waiting time.',
    'draft',
    '2026-10-28';

SET @service_id = (SELECT id FROM services WHERE slug = 'apply-for-tin-bir-form-1904');

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices WHERE name = 'BIR Revenue District Office – General Santos City';

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'You need a TIN to deal with government offices (Executive Order 98), for example as a first-time job seeker.', 1),
(@service_id, 'Or you need a TIN for a one-time transaction, such as a donation, an estate, or a sale of real property or shares.', 2),
(@service_id, 'You do not have a TIN yet.', 3);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'BIR Form 1904 (2 originals for walk-in)', 'Download it from the BIR website or get it at the BIR office. When applying online, you fill in the form on ORUS instead.', 0, 1),
(@service_id, 'One government-issued ID showing your name, address, and birthdate', 'For example PhilID/ePhilID, passport, driver''s license, UMID, voter''s ID, postal ID, PRC ID, or OWWA ID. If it has no address, add proof of residence. Walk-in: 1 photocopy. Online: a scanned copy and a selfie holding the ID.', 0, 2),
(@service_id, 'Barangay certification that you are a resident and a first-time job seeker', 'For first-time job seekers only. Get it at your barangay hall (1 certified true copy, or a scanned copy online).', 1, 3),
(@service_id, 'Marriage contract', 'For married women applying as local employees only (1 photocopy, or a scanned copy online).', 1, 4),
(@service_id, 'Special Power of Attorney, and IDs of you and your representative', 'Only if someone else applies for you. The SPA must state the purpose and the representative''s name.', 1, 5);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Choose online or walk-in', 'Apply online at orus.bir.gov.ph, or go to the BIR Revenue District Office that covers your residence. The office is open from 8:00 AM to 5:00 PM.'),
(@service_id, 2, 'Online: create an ORUS account and apply', 'Fill in the online registration form and upload a scanned copy of your ID, a selfie holding the ID, and any additional documents.'),
(@service_id, 3, 'Walk-in: get a queue number and submit your documents', 'Get one queue number per application. When called, submit BIR Form 1904 and your documents at the Registration Officer counter.'),
(@service_id, 4, 'Receive your TIN', 'Online: you get an email about your application, and if it is approved, your TIN appears on your ORUS profile page. Walk-in: the TIN is written on your copy of BIR Form 1904.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'BIR Citizen''s Charter 2026 (TIN under E.O. 98)', 'https://bir-cdn.bir.gov.ph/BIR/pdf/BIR%20Citizen%27s%20Charter%20(2026%20Edition)%20final.pdf', '2026-10-28'),
(@service_id, 'BIR Online Registration and Update System (ORUS)', 'https://orus.bir.gov.ph', NULL);

-- ---------------------------------------------------------------------------
-- 3. PhilHealth: Register as a member
-- Source: PhilHealth Citizen's Charter 2023, "Enrollment of Members with 5 and below PMRFs".
-- A 2026 edition exists; its text could not be extracted, so an editor should confirm against it.
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'health-insurance'),
    (SELECT id FROM agencies WHERE slug = 'philhealth'),
    'Register as a PhilHealth Member',
    'register-as-philhealth-member',
    'How to register with PhilHealth at a PhilHealth office and get your Member Data Record (MDR) and PhilHealth ID card on the same visit.',
    'All Filipinos, and foreign nationals in the Philippines, can register with PhilHealth. You fill out the PhilHealth Member Registration Form (PMRF) and submit it with proof of your date of birth at a PhilHealth Local Health Insurance Office (LHIO). The office prints your Member Data Record (MDR) and PhilHealth ID card (PIC) on the same visit. Some members need extra documents depending on their category, such as employees, self-earning individuals, senior citizens, and persons with disability.',
    'Free. PhilHealth charges no fee to register.',
    'About 2 hours at the office, including waiting time.',
    'draft',
    '2026-10-28';

SET @service_id = (SELECT id FROM services WHERE slug = 'register-as-philhealth-member');

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices WHERE name = 'PhilHealth Local Health Insurance Office – General Santos City';

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'You are a Filipino citizen, or a foreign national living in the Philippines.', 1),
(@service_id, 'You are not yet registered with PhilHealth.', 2);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'PhilHealth Member Registration Form (PMRF), filled out and signed', 'Download it from the PhilHealth website or get one at any PhilHealth office (1 original copy).', 0, 1),
(@service_id, 'Birth certificate, baptismal certificate, or valid ID', 'Proof of your date of birth (1 photocopy). Without these, a notarized affidavit of two disinterested persons stating your date of birth.', 0, 2),
(@service_id, 'Proof of income', 'For professionals, self-earning individuals, and land-based migrant workers: income tax return, employment contract, financial statement, or other proof of income. Without it, write your monthly income on the PMRF.', 1, 3),
(@service_id, 'Report of Employee-Members (ER-2) from your employer', 'For employees: 2 original copies signed by your employer, with a photocopy of the signatory''s valid ID.', 1, 4),
(@service_id, 'Senior citizen (OSCA) ID or PWD card', 'For senior citizens and persons with disability. The PWD card must be registered in the DOH Philippine Registry for PWDs.', 1, 5),
(@service_id, 'Marriage certificate and birth certificates of dependents', 'Only if you are declaring a spouse or children under 21 as dependents (1 photocopy each, with registry number).', 1, 6);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Fill out the PMRF', 'Download the form from the PhilHealth website or get it at the office. Fill it out and sign it.'),
(@service_id, 2, 'Get a queue number', 'At the PhilHealth office, get a queue number at the Public Assistance desk and wait to be called.'),
(@service_id, 3, 'Submit your form and documents', 'Staff check your form and documents, look up your records, and encode your details.'),
(@service_id, 4, 'Receive your MDR and PhilHealth ID', 'Your Member Data Record and PhilHealth ID card are printed and given to you on the same visit.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'PhilHealth Citizen''s Charter 2023 (Enrollment of Members)', 'https://www.philhealth.gov.ph/about_us/transparency/CitizensCharter2023.pdf', '2026-10-28'),
(@service_id, 'PhilHealth Citizen''s Charter 2026 (check for changes)', 'https://www.philhealth.gov.ph/about_us/transparency/PhilHealthCitizen%27sCharter_Handbook2026_1stEdition.pdf', NULL);

-- ---------------------------------------------------------------------------
-- 4. Pag-IBIG: Register for membership
-- Source: Member's Data Form HQP-PFF-039 (V10, 04/2023). The Pag-IBIG website could not be checked,
-- so this guide has no verification date and must be confirmed before publishing.
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'housing-pagibig'),
    (SELECT id FROM agencies WHERE slug = 'pag-ibig-fund'),
    'Register for Pag-IBIG Fund Membership',
    'register-for-pag-ibig-membership',
    'How to register with the Pag-IBIG Fund and get your Pag-IBIG Membership ID (MID) number.',
    'Registering with the Pag-IBIG Fund gives you a Pag-IBIG Membership ID (MID) number, a unique 12-digit number for all your Pag-IBIG transactions. You register by filling out the Member''s Data Form (MDF), online or at a Pag-IBIG branch, and submitting a photocopy of a valid ID. Online registration gives you a Registration Tracking Number (RTN).',
    NULL,
    NULL,
    'draft',
    NULL;

SET @service_id = (SELECT id FROM services WHERE slug = 'register-for-pag-ibig-membership');

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices WHERE name = 'Pag-IBIG Fund General Santos Branch';

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'You are employed, self-employed, not yet employed, or a first-time job seeker.', 1),
(@service_id, 'You are not yet a Pag-IBIG member.', 2);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'Member''s Data Form (MDF, HQP-PFF-039)', 'Fill out 1 copy in capital letters. If you register online, print it back to back on one sheet.', 0, 1),
(@service_id, 'Photocopy of at least one valid ID accepted by Pag-IBIG', NULL, 0, 2),
(@service_id, 'Full names of your father and mother', 'Write them as they appear on your birth certificate.', 0, 3);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Fill out the Member''s Data Form', 'Register online through the Pag-IBIG Fund website, or get the form at a Pag-IBIG branch. First-time job seekers should tick the first-time jobseeker box.'),
(@service_id, 2, 'Keep your Registration Tracking Number', 'If you register online, you get a Registration Tracking Number (RTN). Keep it for follow-ups.'),
(@service_id, 3, 'Submit the form and a copy of your ID', 'Submit your MDF with a photocopy of a valid ID accepted by Pag-IBIG.'),
(@service_id, 4, 'Get your MID number', 'Pag-IBIG assigns your 12-digit MID number. To change your details later, use the Member''s Change of Information Form (MCIF, HQP-PFF-049) at any Pag-IBIG branch.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'Pag-IBIG Fund official website', 'https://www.pagibigfund.gov.ph', NULL);

-- ---------------------------------------------------------------------------
-- 5. City Government: New business permit
-- Source: City Mayor's Office – Business Permits & Licensing Division Citizen's Charter 2026 (1st Edition)
-- ---------------------------------------------------------------------------
INSERT INTO services (category_id, agency_id, title, slug, summary, description, fee_description, processing_time_description, status, last_verified_at)
SELECT
    (SELECT id FROM categories WHERE slug = 'business-permits'),
    (SELECT id FROM agencies WHERE slug = 'city-government-of-general-santos'),
    'Apply for a New Business Permit',
    'new-business-permit-general-santos',
    'How to apply for a new business (Mayor''s) permit in General Santos City online through Filipizen, from application to payment.',
    'Anyone who will run a business, trade, or activity in General Santos City must first get a Mayor''s Permit and pay the business tax, under the city''s Revenue Code of 1996. New business permits are applied for online at www.filipizen.com, with General Santos City as the partner LGU. The Business Permits and Licensing Division of the City Mayor''s Office evaluates your application, the Office of the Building Official and the City Treasurer''s Office assess your fees, and you pay online or at the City Treasurer''s Office.',
    'Depends on your line of business, under the General Santos City Revenue Code of 1996. Your billing statement lists all taxes, fees, and charges.',
    'About 4 hours and 40 minutes of processing by the city after you submit, not counting your own steps.',
    'draft',
    '2026-10-28';

SET @service_id = (SELECT id FROM services WHERE slug = 'new-business-permit-general-santos');

INSERT INTO service_offices (service_id, office_id)
SELECT @service_id, id FROM offices WHERE name = 'Business Permits and Licensing Division, City Mayor''s Office (City Hall)';

INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES
(@service_id, 'You will establish, operate, or conduct a business, trade, or activity in General Santos City.', 1),
(@service_id, 'Your business is registered with DTI, SEC, or CDA.', 2);

INSERT INTO service_requirements (service_id, requirement_text, notes, is_optional, display_order) VALUES
(@service_id, 'DTI, SEC, or CDA registration', 'Proof that your business is registered.', 0, 1),
(@service_id, 'Proof that you may use the business location', 'If you own it: Transfer Certificate of Title or Tax Declaration. If not: contract of lease, memorandum of agreement, or written consent of the property owner.', 0, 2),
(@service_id, 'Fire Safety Inspection Certificate (FSIC) for occupancy', 'Must be issued within the last 9 months. New businesses may submit the fire safety inspection for new business instead.', 0, 3),
(@service_id, 'Affidavit of Undertaking', 'Only if you use an existing FSIC for occupancy: a statement that the building has had no substantial changes since the FSIC was issued.', 1, 4),
(@service_id, 'Unified Application Form, complete and signed', 'You download it during the online application, sign it, and upload it.', 0, 5),
(@service_id, 'Active email address and mobile number', 'Filipizen sends a 6-digit validation key and status updates to these.', 0, 6),
(@service_id, 'Online banking, e-wallet, or credit/debit card details', 'For online payment. To pay at the City Treasurer''s Office instead, bring your Business Identification Number (BIN) or registered trade name and the Tax Order of Payment for your cedula.', 1, 7);

INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES
(@service_id, 1, 'Start a new application on Filipizen', 'Go to www.filipizen.com, select General Santos City as the partner LGU, click Go To Services, then choose New Business Application and Create New Application. Enter your name, address, email, and mobile number, then enter the 6-digit validation key sent to you.'),
(@service_id, 2, 'Enter your business details', 'Choose your organization type and enter your business and trade names. Write down the tracking number shown on screen. Then fill in whether the place is rented, the business address, the line of business, and the business information.'),
(@service_id, 3, 'Upload your requirements and submit', 'Download the Unified Application Form, sign it, and upload it with your other requirements. Review all details, then click Submit.'),
(@service_id, 4, 'Wait for approval and assessment', 'The city evaluates your application and assesses your fees. You get an email when your application is approved, and another when it is approved for payment.'),
(@service_id, 5, 'View your billing statement', 'Open the link in the approval-for-payment email, or choose Business Online Billing on Filipizen. Verify with the 6-digit key and enter your Business Identification Number (BIN).'),
(@service_id, 6, 'Pay and print your permit', 'Pay online through Filipizen (for example with GCash) or at the City Treasurer''s Office, then print your business permit.');

INSERT INTO service_sources (service_id, label, url, verified_at) VALUES
(@service_id, 'General Santos City BPLD Citizen''s Charter 2026', 'https://hrmdo.gensantos.gov.ph/uploads/services/6e3d973bfab34189221760fe39af68b1.pdf', '2026-10-28'),
(@service_id, 'Filipizen: General Santos City', 'https://www.filipizen.com/partners/gensan_gensan', NULL);
