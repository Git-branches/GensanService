# Database

MySQL 8+ / MariaDB 10.4+ schema for Andam GenSan.

## Structure

- `schema.sql` creates the full, current schema in one step (use it for new installs).
- `migrations/` holds the same schema as ordered steps. Run new ones on an existing database.
- `seeders/` holds starter data: categories, agencies, a local admin account, one sample guide, and five draft guides for the General Santos City offices of SSS, BIR, PhilHealth, Pag-IBIG, and the City Government.

## New install (XAMPP / MariaDB)

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS gensan_service_navigator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root gensan_service_navigator < database/schema.sql
```

To load the starter data (Git Bash):

```bash
for f in database/seeders/*.sql; do
  /c/xampp/mysql/bin/mysql.exe -u root gensan_service_navigator < "$f"
done
```

Add `-p` if your MySQL user has a password.

## Updating an existing database

Run any migrations your database doesn't have yet, in order:

| Migration | Adds |
|---|---|
| `015_create_login_attempts_table.sql` | Sign-in throttling for the admin panel |
| `016_add_review_fields_to_content_reports.sql` | Reporter IP (for rate limiting) and admin notes on reports |
| `017_add_agency_contacts_and_linked_requirements.sql` | Agency contacts and checklist items that link to other guides |
| `018_add_review_workflow_verification_and_revisions.sql` | Guide review statuses, verification, and version history |
| `019_add_resident_features.sql` | Search keywords, agency presence, office branch types, daily guide views, and the FAQ |
| `020_add_admin_tools.sql` | Failed sign-ins in the activity log, agency verification, review notes, report resolutions, and notices |
| `021_add_site_analytics.sql` | Anonymous daily page counts (page type, language, and screen size only) for the admin analytics page |

## Default local admin account

Created by `seeders/003_seed_admin.sql`:

- Email: `admin@gensan-service-navigator.local`
- Password: `ChangeMe123!`

This password is public. The admin panel shows a warning on every page until it is changed from **My account**. For production, change it immediately and create named accounts for each staff member.

## Notes

- All tables use InnoDB and `utf8mb4`.
- Deleting a service cascades to its requirements, steps, eligibility, sources, and reports. The admin panel archives guides instead of deleting them.
- `services.status` (`draft`, `for_review`, `approved`, `published`, `archived`) controls visibility. The public API returns only published guides.
- A `FULLTEXT` index on `services(title, summary, description)` powers search.
- The sample PSA office in `seeders/004_seed_sample_service.sql` has no address or hours and is left unverified on purpose. Fill in its real details from the admin panel.
- `seeders/005_seed_gensan_guides.sql` adds its guides as drafts, written from each agency's Citizen's Charter or website as checked on October 28, 2026. Before publishing a guide, open its sources and confirm the details. The Pag-IBIG guide has no verification date because the Pag-IBIG website could not be checked. Its offices are unverified; only the BIR office has an address, taken from the BIR Citizen's Charter.
- `seeders/006_update_gensan_office_details.sql` fills in addresses, contact details, and the SSS map pin from official directories (checked October 29, 2026). The offices stay unverified until confirmed with each office, and Pag-IBIG has no address yet because no official source could be checked. It is safe to run more than once.
- `seeders/009_seed_faqs.sql` adds the FAQ in English, Bisaya, Filipino, and Hiligaynon. The translations are first drafts. It skips itself if any FAQ already exists.
- `seeders/010_seed_clearance_guides.sql` adds draft guides for the NBI Clearance, National Police Clearance, Barangay Clearance, and Cedula, plus the NBI and PNP as agencies (checked November 1, 2026). Each guide stays unverified, and its verification notes list what to confirm. The Barangay Clearance guide should not be published until a barangay hall confirms its requirements and fee.
- `seeders/011_update_sss_guide_details.sql` fills in the SSS guide's fee and processing time and the General Santos branch hours from official SSS documents (checked November 1, 2026). The guide stays Needs review. It is safe to run more than once.
- `seeders/012_verify_published_guides.sql` records the check of the published guides against official sources on November 1, 2026. It corrects the PSA guide, updates the PhilHealth, BIR, and business permit details, and marks all but Pag-IBIG as Verified. Pag-IBIG stays Unverified because its website could not be read. Offices are not changed. It writes directly to the database, so these changes do not appear in version history or the activity log. It is safe to run more than once.
- `seeders/013_add_pnp_gensan_offices_and_guides.sql` adds the PNP's General Santos City offices to the existing PNP agency, publishes the corrected National Police Clearance guide, and adds three draft guides (checked November 2, 2026). GSCPO and seven stations are public but unverified. Police Stations 4, 5, and 8 stay hidden until an official source confirms them. No guide is linked to an office until an official source says which stations handle it. It is safe to run more than once.
- `seeders/008_update_categories.sql` moves the original 7 categories to the 10 in the project specification. Existing web addresses stay the same. Social Security and Housing and Pag-IBIG are hidden, not deleted, after their guides move to Taxation and Government Contributions. It is safe to run more than once.
