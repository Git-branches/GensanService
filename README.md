# Andam GenSan (_GensanService_, _gensan-service-navigator_)

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Independent guide to government service requirements, checklists, and offices in General Santos City.

Andam GenSan helps residents of General Santos City get ready for government transactions. For services from SSS, PhilHealth, Pag-IBIG, PSA, BIR, and the City Government, it shows what to bring, the steps to follow, and which office to visit. "Andam" is Bisaya for "ready." Staff keep the guides accurate through an admin panel that tracks when each guide was last verified against official sources.

Andam GenSan is an independent community project. It is not an official government website, and it does not represent, replace, or process applications for any government agency.

The project started as *GenSan Service Navigator*. The GitHub repository (`GensanService`), the project folder and npm package (`gensan-service-navigator`), and the database (`gensan_service_navigator`) still use the original names.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
  - [Dependencies](#dependencies)
- [Usage](#usage)
- [Deployment](#deployment)
- [Operations](#operations)
- [Roadmap](#roadmap)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Security

- A production install has no seeded admin account. Create the first admin with a locally generated `password_hash()` (see [Deployment](#deployment)); the test-only account in `database/seeders/dev/` is never imported into production. An account that still uses the old published password can sign in but must change it before any other admin screen loads.
- Admin passwords are hashed with `password_hash()`. Sign-in is throttled per email-and-address pair, per address, and per account, so one visitor cannot lock a known admin's email.
- Admin sessions use HttpOnly, SameSite cookies, a new session ID at sign-in and after password changes, and a 2-hour idle timeout. Changing or resetting a password ends every older session for that account. Cookies are marked Secure in production.
- Every admin request that changes data needs a CSRF token. Roles are checked on the server for every request.
- All input is validated on the server, and all queries use PDO prepared statements.
- The public report form has a honeypot field and a limit of 5 reports per hour per IP address. Anonymous page views, guide views, and guide feedback are also capped per visitor and hour.
- In production, errors are logged to `backend/storage/logs/app.log` instead of being shown. The API and the built site send `nosniff`, `X-Frame-Options`, `Referrer-Policy`, and a Content Security Policy; HSTS is sent over HTTPS in production.
- The site never asks for government account passwords or one-time PINs (OTPs).
- Visitor records are kept only as long as needed: admin sign-in attempts for 30 days, resolved reports for 12 months (24 months if still unresolved), and the admin activity log for 24 months. The log file rotates at 5 MB. A token-protected maintenance endpoint enforces these limits; see [Operations](#operations).

Do not open a public issue for security problems. Email the maintainer instead (see [Maintainers](#maintainers)).

## Background

Requirements for government services in the Philippines are scattered across agency websites, Facebook pages, and word of mouth. Residents often find out what's missing only after waiting in line. Andam GenSan collects this information in one place, in plain language, with a checklist and a link to the official source for every guide.

### Features

For residents (no account needed):

- Search across guides, agencies, offices, and categories, with suggestions as you type and your recent searches. Search also covers the documents a guide requires, each guide's keywords, and common local words and old names, such as "sedula", "pulis", "lisensya", and "NSO".
- Service guides with eligibility, a document checklist, application steps, fees, processing times, offices, and official sources.
- A document checklist with a progress bar that saves on the device.
- Life events: step-by-step paths for one situation, such as starting a business or looking for work, that put the guides in order. Steps can be ticked off, and progress saves on the device.
- "Did this guide help?" on every guide: an anonymous yes or no, with a reason for no. Each browser answers a guide once.
- "Set a renewal reminder" on guides for permits and cards that expire: the resident enters the expiry date and gets a Google Calendar event or a calendar file two weeks before it. Nothing is sent to the site.
- "What changed" on a guide, from the notes editors write for residents when they update it.
- "Open now" on offices with confirmed weekly hours, in Philippine time. Offices that are not verified never show it.
- Agency and office directories with hotlines, emails, Facebook pages, and Google Maps and Waze links.
- Checklist items can link to the guide that explains how to get that document.
- A "Report incorrect information" form on every guide.
- Share and copy-link actions on every guide, plus related guides.
- Popular guides, recently updated guides, and guides you recently viewed on your device.
- A searchable FAQ in four languages and a privacy policy.
- Interface in English, Bisaya, Filipino, or Hiligaynon (see [Languages](#languages)).
- Larger text (two extra sizes) and a high-contrast mode, from the "Aa" button in the top bar. The choice is remembered on the device and applied before the page first appears.
- Offline use: the site can be installed on a phone, and pages and guides already opened keep working without signal. "Save offline" on a guide stores it ahead of time. A banner shows when the phone is offline.
- Link previews: a guide shared on Facebook, Messenger, Viber, or X shows its title, summary, and the share image. The site also has `sitemap.xml` and `robots.txt` for search engines.

For administrators (`/admin`):

- A dashboard of published guides, guides waiting for review or ready to publish, guides needing verification, overdue reviews, open reports, agencies, and offices, with recent activity. The sidebar shows a count beside anything that needs attention.
- Create and edit service guides, then move them through review: Draft, For review, Approved, Published. Guides can also be unpublished, archived, and restored.
- Set each guide's verification status (Verified, Needs review, Unverified, Outdated) and its next review date. Changing a verified guide sets it back to Needs review.
- Every change to a guide keeps the previous version. Anyone can compare versions, and a super admin can restore one. Restoring keeps a copy of what it replaces.
- Preview a guide as residents will see it before it is published, duplicate a guide as a new unverified draft, and leave a note when sending a guide back.
- Manage agencies (with logos), offices, and categories. Records are deactivated, never deleted. Agencies have their own verification status.
- Manage life events: their steps, the guide each step links to, and an official source for steps without a guide.
- Mark a guide for renewal reminders, and add a note for residents when saving a change.
- Set an office's regular weekly hours.
- See "Did this guide help?" answers per guide on the analytics page, with the guides that got the most No answers first.
- Manage the FAQ in all four languages. A language left blank shows the English text.
- Post notices that show as a banner across the public site, with optional start and end times. A super admin can also replace the whole site with a maintenance notice, which must have an end time. The admin panel keeps working during maintenance.
- Review residents' reports and record how each was resolved. See an activity log of every sign-in, failed sign-in, and change, filtered by date. Passwords are never logged.
- See anonymous analytics: visits per day, by kind of page, language, and screen size, plus the most opened guides, for the last 7, 30, or 90 days. Only those counts are stored, with no IP address, cookie, or visitor ID, and browsers that ask not to be tracked are not counted.
- Manage admin accounts and roles (super admins only), and change your own password.

| Role | Can do |
|---|---|
| Super admin | Everything, including publishing and managing admin accounts |
| Editor | Create and change draft guides, submit them for review, manage agencies, offices, the FAQ, and notices, handle reports |
| Reviewer | Approve guides or send them back, set verification on guides and agencies, handle reports |

### Information accuracy

Every published guide should name the responsible agency and list the requirements, eligibility, and steps. It should include official source links, plus fees and processing times only when they are confirmed. Each guide shows a last-verified date. Office details should be marked verified only after they are confirmed with the office. See [system-requirements.md](system-requirements.md) for the full requirements.

### Languages

Visitors pick a language from the switcher at the top of every page, and the choice is saved on their device. The switcher translates the site's own text: menus, buttons, labels, and messages. Guide content from the database (titles, requirements, steps) and the admin panel stay in English.

| Language | Status |
|---|---|
| English | Source text |
| Bisaya (Cebuano), Filipino, Hiligaynon | Available. First drafts that still need review by native speakers |
| Blaan, Maguindanaon, Maranao | Hidden until translated |

Translations live in `frontend/src/i18n/locales/`, one file per language, with `en.js` as the source. Any text a language leaves out is shown in English. To translate:

1. Copy keys from `en.js` into the language's file and replace the English text. Keep `{placeholders}` such as `{count}` and `{agency}` unchanged.
2. Preview the language at `/?lang=<code>` (for example `/?lang=mdh`). This works for hidden languages too.
3. When the translation is complete and reviewed, set `enabled: true` for it in `frontend/src/i18n/languages.js`.

### Built with

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Lucide icons
- **Backend:** PHP 8.2+ JSON API (no framework), PDO, `vlucas/phpdotenv`
- **Database:** MySQL 8+ or MariaDB 10.4+

### Project structure

```text
gensan-service-navigator/
├── frontend/              React app: public site and admin panel (src/admin, loaded only on /admin)
├── backend/
│   ├── app/               Controllers (public and Admin/), auth, validation, logging
│   ├── public/            Web root: index.php, router.php (dev server), .htaccess
│   ├── routes/api.php     All API routes
│   └── storage/logs/
├── database/              schema.sql, migrations/, seeders/ (see database/README.md)
└── system-requirements.md
```

## Install

### Dependencies

- [XAMPP](https://www.apachefriends.org/) or another setup with PHP 8.2+ and MySQL 8+ / MariaDB 10.4+
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) LTS and npm

These steps use Windows with XAMPP. Start MySQL from the XAMPP Control Panel first, then run the commands from the project root:

```bash
# 1. Database: create it and load the schema
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS gensan_service_navigator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root gensan_service_navigator < database/schema.sql

# 2. Backend: PHP dependencies and settings (edit .env if your MySQL user has a password)
cd backend
composer install
copy .env.example .env
cd ..

# 3. Frontend: JavaScript dependencies
cd frontend
npm install
```

To add starter data (categories, agencies, a sample guide, and the local test admin), run each file in `database/seeders/` in order, then `database/seeders/dev/003_seed_admin.sql` for local development only. See [database/README.md](database/README.md).

If your database was created before October 2026, run `database/migrations/015_create_login_attempts_table.sql`, `016_add_review_fields_to_content_reports.sql`, `017_add_agency_contacts_and_linked_requirements.sql`, `018_add_review_workflow_verification_and_revisions.sql`, `019_add_resident_features.sql`, `020_add_admin_tools.sql`, `021_add_site_analytics.sql`, `022_add_life_events_feedback_reminders_updates_and_hours.sql`, `023_add_public_rate_limits.sql`, and `024_add_password_changed_at.sql`, in that order. Then run `database/seeders/008_update_categories.sql` and `009_seed_faqs.sql`.

## Usage

Start the API and the frontend in two terminals:

```bash
# Terminal 1: from backend/
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t public public/router.php

# Terminal 2: from frontend/
npm run dev
```

- Public site: <http://localhost:5173>. Vite forwards `/api` requests to the PHP server.
- Admin panel: <http://localhost:5173/admin>. Sign in with the local test account from `database/seeders/dev/003_seed_admin.sql`, or with an account you create.
- API health check: <http://127.0.0.1:8000/api/health>

The `public/router.php` argument is required, because without it PHP's built-in server returns 404 for API routes.

Before committing, run the checks:

```bash
cd frontend
npm run lint
npm test
npm run build
```

`npm test` runs the small unit tests and checks that every language shown in the switcher has all of the English strings.

The API tests create accounts and guides, so run them against a throwaway database, never a real one. Create it from `database/schema.sql`, the seeders, and `database/seeders/dev/003_seed_admin.sql` (the test admin), start the API with `DB_DATABASE` set to it, and run this from the project root:

```bash
node --test "backend/tests/*.test.mjs"
```

## Deployment

### Shared hosting with one web root

On a host without SSH, Composer, or a VirtualHost — InfinityFree, for example — the API cannot be
aliased to `backend/public`, and the code has to sit inside the web root. Follow
[Deploying on InfinityFree](docs/DEPLOY-INFINITYFREE.md): `npm run deploy:prepare` in `frontend/`
builds the folder to upload, puts a small front controller at `/api`, and relies on
`backend/.htaccess` to refuse `app/`, `config/`, `storage/`, `vendor/`, and `.env` over the web.
Set `FRONTEND_DIST` and `UPLOADS_DIR` in `backend/.env` to the web root and its `api/uploads` folder.

### Apache with a VirtualHost

1. Build the frontend with `npm run build` in `frontend/`. The build also pre-renders the public pages and, when the API is reachable, every published guide and life event with its own title and description, so visitors on slow connections and search engines see them before the JavaScript loads. It reads `http://127.0.0.1:8000/api` by default; set `PRERENDER_API_URL` to build against another address. Without the API the build still succeeds with the fixed pages and the shell. On a server other than Apache, send any address with no matching file to `shell.html`. The output in `frontend/dist/` includes an `.htaccess` file that makes routes like `/services/...` and `/admin` work on reload.
2. Copy `backend/` to the server, outside the public web folder if possible, and run `composer install --no-dev --optimize-autoloader`.
3. In `backend/.env`, set `APP_ENV=production`, `APP_DEBUG=false`, an empty `CORS_ALLOWED_ORIGIN`, and your database credentials. If a CDN or reverse proxy sits in front of the site, set `TRUSTED_PROXIES` to its IPs or CIDRs so rate limits and sign-in throttling see the real visitor. Make `backend/storage/logs/` and `backend/public/uploads/` writable by the web server. Uploaded agency logos are saved in `uploads/`, whose `.htaccess` blocks scripts from running there.
4. Serve both from one HTTPS domain: the frontend at `/` and the API's `public/` folder at `/api`. Enable `mod_rewrite`. `mod_headers` is recommended, and so is `mod_deflate`, which compresses pages for visitors on mobile data:

   ```apache
   <VirtualHost *:443>
       ServerName your-domain
       DocumentRoot /var/www/andam-gensan/frontend/dist

       Alias /api /var/www/andam-gensan/backend/public
       <Directory /var/www/andam-gensan/backend/public>
           AllowOverride All
           Require all granted
       </Directory>
       <Directory /var/www/andam-gensan/frontend/dist>
           AllowOverride All
           Require all granted
       </Directory>

       SSLEngine on
       # SSLCertificateFile / SSLCertificateKeyFile ...
   </VirtualHost>
   ```

5. Create the database from `database/schema.sql`, run only the seeders you need, and back the database up regularly (for example, a nightly `mysqldump`). Do not import `database/seeders/dev/003_seed_admin.sql`; it exists for tests.
   Copy `backend/public/uploads/` from your current install too, because agency logos are not in Git.
   Optionally set `SITE_URL` in `backend/.env` to the public address, such as `https://andamgensan.ph`, for link previews and the sitemap. Left empty, each request's own address is used. If the built frontend is not at `../frontend/dist` next to `backend/`, set `FRONTEND_DIST` to its folder.
   Link previews, `/sitemap.xml`, and `/robots.txt` are served by the API through the rules in `frontend/public/.htaccess`, so they need `mod_rewrite` and the `/api` path shown above.
6. Create the first admin with a hash generated on your own machine, never a password sent through chat or email:

   ```bash
   php -r "echo password_hash('YOUR-STRONG-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
   ```

   Then run `INSERT INTO admins (name, email, password_hash, role, password_changed_at) VALUES ('Your Name', 'you@example.com', 'PASTE-THE-HASH', 'super_admin', NOW());` and sign in. Create named accounts for your staff and deactivate any you don't need. Check `/api/health` first; it reports missing extensions and unsafe settings.

## Operations

The [operations runbook](docs/RUNBOOK.md) covers backups and the restore drill, retention, the external cron call, uptime monitoring, and what to do when the site is down.

- `GET /api/health` reports the database, required PHP extensions, writable folders, and unsafe settings. Point an uptime monitor at it and require `"status":"ok"` in the response.
- `POST /api/maintenance/run` deletes old rows and rotates the log. Set `MAINTENANCE_TOKEN` in `backend/.env`, then call it daily from an external scheduler on hosts without cron. It accepts the token in `X-Maintenance-Token`, returns counts only, and writes one `system.maintenance` row to the activity log.
- `app.log` rotates at 5 MB into `app.log.1` and `app.log.2`, so the log folder stays bounded.

## Roadmap

- [x] Project setup and database design
- [x] Public homepage, search, and categories
- [x] Service guide pages and office directory
- [x] REST API and database integration
- [x] Admin content management, reports, and activity log
- [x] Security hardening and deployment setup
- [x] Interface in Bisaya, Filipino, and Hiligaynon
- [ ] Native-speaker review of the Bisaya, Filipino, and Hiligaynon text
- [ ] Blaan, Maguindanaon, and Maranao translations
- [x] Guide review workflow, verification status, and version history
- [x] Site-wide search, FAQ, privacy policy, and share actions
- [x] Admin version history, preview, FAQ and notice management, agency verification, and alerts
- [x] Offline use and app install, larger text and high contrast, link previews and sitemap, and anonymous analytics
- [ ] Choose hosting and deploy
- [ ] Automated tests for the rest of the API
- [ ] Add and verify real service guides and office details


## Maintainers

[@Git-branches](https://github.com/Git-branches) (Rhon Jon Romero)

## Contributing

Questions, bug reports, and corrections to service information are welcome as [GitHub issues](https://github.com/Git-branches/GensanService/issues). Pull requests are accepted.

- Run `npm run lint` and `npm run build` in `frontend/` before opening a pull request.
- For changes to service requirements, fees, or office details, link the official source you used.
- Never commit `backend/.env`, real passwords, or personal data.

## License

UNLICENSED © Rhon Jon Romero. No license has been chosen yet, so all rights are reserved.
