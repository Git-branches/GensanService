# Database

MySQL 8+ / MariaDB 10.4+ schema for Andam GenSan.

## Structure

- `schema.sql` creates the full, current schema in one step (use it for new installs).
- `migrations/` holds the same schema as ordered steps. Run new ones on an existing database.
- `seeders/` holds starter data: categories, agencies, one sample guide, and five draft guides for the General Santos City offices of SSS, BIR, PhilHealth, Pag-IBIG, and the City Government.
- `seeders/dev/` holds the test-only admin account. It is never imported into a production database.

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

For local development and the API tests only, also load the test admin:

```bash
/c/xampp/mysql/bin/mysql.exe -u root gensan_service_navigator < database/seeders/dev/003_seed_admin.sql
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
| `022_add_life_events_feedback_reminders_updates_and_hours.sql` | Life events and their steps, anonymous "Did this guide help?" totals, the renewal reminder flag on guides, notes for residents on guide versions, and weekly office hours |
| `023_add_public_rate_limits.sql` | Per-hour counters that keep anonymous page views, guide views, and feedback honest |
| `024_add_password_changed_at.sql` | The last password change, used to end older admin sessions after a change or reset |

## Admin accounts

There is no production seed account. Create the first super admin with a hash generated on your own
machine:

```bash
php -r "echo password_hash('YOUR-STRONG-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
```

```sql
INSERT INTO admins (name, email, password_hash, role, password_changed_at)
VALUES ('Your Name', 'you@example.com', 'PASTE-THE-HASH', 'super_admin', NOW());
```

`seeders/dev/003_seed_admin.sql` creates a local test account
(`admin@gensan-service-navigator.local` / `LocalDev-Password-2026!`). It is for development and the API
tests only; never import it into a production database.

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
- `seeders/014_seed_city_charter_guides.sql` adds two guides from the City's Citizen's Charter (read November 5, 2026): Renew a Business Permit and Get a Health Certificate. Both are published but unverified, so residents see a "Not yet verified" badge. It also notes the City Treasurer's Office locations on the Cedula draft. It is safe to run more than once.
- `seeders/015_seed_life_events.sql` adds two life events, Starting a business and Looking for work, ordered by what the official requirements ask for (BPLD charter 2026, City Health Office sanitary permit charter), and turns on renewal reminders for the business permit and health card guides. Steps that point to an unpublished guide show without a link until it is published. Run it after migration 022. It is safe to run more than once.
- `seeders/016_publish_launch_guides.sql` publishes the day-one guides that are verified and still drafts: SSS, BIR, PhilHealth, and the new city business permit. PSA is already published, and Pag-IBIG stays a draft because it is unverified. It is safe to run more than once.
- `seeders/017_verify_city_guides.sql` records the check of the Renew a Business Permit and Get a Health Certificate guides against the City's Citizen's Charter on November 12, 2026. It adds the charter's payment windows to the renewal guide and marks both guides Verified. The BPLD and City Health Office stay unverified because the charters do not give their address, phone, email, or office hours. It is safe to run more than once.
- `seeders/008_update_categories.sql` moves the original 7 categories to the 10 in the project specification. Existing web addresses stay the same. Social Security and Housing and Pag-IBIG are hidden, not deleted, after their guides move to Taxation and Government Contributions. It is safe to run more than once.
