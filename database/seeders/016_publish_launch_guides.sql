-- Publishes the day-one guides that are already verified and still drafts.
--
-- A fresh install (schema.sql plus seeders) publishes only the PSA guide. SSS, BIR, PhilHealth, and the
-- new city business permit are verified but stay drafts until this runs. Pag-IBIG is deliberately left
-- out: it is still unverified and missing its fee and processing time.
--
-- Run after 012 and 014. Safe to run more than once: a guide that is already published, or that is not
-- verified, is left as it is.

SET NAMES utf8mb4;

UPDATE services
SET status = 'published',
    published_at = COALESCE(published_at, NOW())
WHERE slug IN (
    'apply-for-sss-number',
    'apply-for-tin-bir-form-1904',
    'register-as-philhealth-member',
    'new-business-permit-general-santos'
)
AND verification_status = 'verified'
AND status = 'draft';
