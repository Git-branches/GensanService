-- Agency contact details (needs migration 017). Only values taken from an official source are filled in;
-- add the rest from the admin panel (Agencies > Edit). Safe to run more than once.

SET NAMES utf8mb4;

-- SSS Hotline 1455, from sss.gov.ph "Become an SSS Member" (checked 2026-10-28).
UPDATE agencies SET hotline = '1455' WHERE slug = 'social-security-system' AND hotline IS NULL;
