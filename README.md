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
- [Roadmap](#roadmap)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Security

- The seeded admin account (`admin@gensan-service-navigator.local` / `ChangeMe123!`) is public. Change its password right after setup. The admin panel shows a warning on every page until you do.
- Admin passwords are hashed with `password_hash()`. Sign-in is blocked for 15 minutes after 5 failed attempts.
- Admin sessions use HttpOnly, SameSite cookies, a new session ID at sign-in and after password changes, and a 2-hour idle timeout. Cookies are marked Secure in production.
- Every admin request that changes data needs a CSRF token. Roles are checked on the server for every request.
- All input is validated on the server, and all queries use PDO prepared statements.
- The public report form has a honeypot field and a limit of 5 reports per hour per IP address.
- In production, errors are logged to `backend/storage/logs/app.log` instead of being shown. The API sends `nosniff`, `X-Frame-Options`, `Referrer-Policy`, and (in production) HSTS headers.
- The site never asks for government account passwords or one-time PINs (OTPs).

Do not open a public issue for security problems. Email the maintainer instead (see [Maintainers](#maintainers)).

## Background

Requirements for government services in the Philippines are scattered across agency websites, Facebook pages, and word of mouth. Residents often find out what's missing only after waiting in line. Andam GenSan collects this information in one place, in plain language, with a checklist and a link to the official source for every guide.

### Features

For residents (no account needed):

- Search across guides, agencies, offices, and categories, with suggestions as you type and your recent searches. Search also covers the documents a guide requires, each guide's keywords, and common local words and old names, such as "sedula", "pulis", "lisensya", and "NSO".
- Service guides with eligibility, a document checklist, application steps, fees, processing times, offices, and official sources.
- A document checklist with a progress bar that saves on the device.
- Agency and office directories with hotlines, emails, Facebook pages, and Google Maps and Waze links.
- Checklist items can link to the guide that explains how to get that document.
- A "Report incorrect information" form on every guide.
- Share, copy, and print actions on every guide, plus related guides.
- Popular guides, recently updated guides, and guides you recently viewed on your device.
- A searchable FAQ in four languages and a privacy policy.
- Interface in English, Bisaya, Filipino, or Hiligaynon (see [Languages](#languages)).

For administrators (`/admin`):

- A dashboard of published guides, guides waiting for review or ready to publish, guides needing verification, overdue reviews, open reports, agencies, and offices, with recent activity. The sidebar shows a count beside anything that needs attention.
- Create and edit service guides, then move them through review: Draft, For review, Approved, Published. Guides can also be unpublished, archived, and restored.
- Set each guide's verification status (Verified, Needs review, Unverified, Outdated) and its next review date. Changing a verified guide sets it back to Needs review.
- Every change to a guide keeps the previous version. Anyone can compare versions, and a super admin can restore one. Restoring keeps a copy of what it replaces.
- Preview a guide as residents will see it before it is published, duplicate a guide as a new unverified draft, and leave a note when sending a guide back.
- Manage agencies (with logos), offices, and categories. Records are deactivated, never deleted. Agencies have their own verification status.
- Manage the FAQ in all four languages. A language left blank shows the English text.
- Post notices that show as a banner across the public site, with optional start and end times. A super admin can also replace the whole site with a maintenance notice, which must have an end time. The admin panel keeps working during maintenance.
- Review residents' reports and record how each was resolved. See an activity log of every sign-in, failed sign-in, and change, filtered by date. Passwords are never logged.
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

To add starter data (categories, agencies, a sample guide, and the local admin account), run each file in `database/seeders/` in order. See [database/README.md](database/README.md).

If your database was created before October 2026, run `database/migrations/015_create_login_attempts_table.sql`, `016_add_review_fields_to_content_reports.sql`, `017_add_agency_contacts_and_linked_requirements.sql`, `018_add_review_workflow_verification_and_revisions.sql`, `019_add_resident_features.sql`, and `020_add_admin_tools.sql`, in that order. Then run `database/seeders/008_update_categories.sql` and `009_seed_faqs.sql`.

## Usage

Start the API and the frontend in two terminals:

```bash
# Terminal 1: from backend/
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t public public/router.php

# Terminal 2: from frontend/
npm run dev
```

- Public site: <http://localhost:5173>. Vite forwards `/api` requests to the PHP server.
- Admin panel: <http://localhost:5173/admin>. Sign in with the seeded account, then change its password from **My account**.
- API health check: <http://127.0.0.1:8000/api/health>

The `public/router.php` argument is required, because without it PHP's built-in server returns 404 for API routes.

Before committing, run the checks:

```bash
cd frontend
npm run lint
npm run build
```

The API tests create accounts and guides, so run them against a throwaway database, never a real one. Create it from `database/schema.sql` and the seeders, start the API with `DB_DATABASE` set to it, and run this from the project root:

```bash
node --test "backend/tests/*.test.mjs"
```

## Deployment

1. Build the frontend with `npm run build` in `frontend/`. The build also pre-renders the public pages, so visitors on slow connections see them before the JavaScript loads. The output in `frontend/dist/` includes an `.htaccess` file that makes routes like `/services/...` and `/admin` work on reload.
2. Copy `backend/` to the server, outside the public web folder if possible, and run `composer install --no-dev --optimize-autoloader`.
3. In `backend/.env`, set `APP_ENV=production`, `APP_DEBUG=false`, an empty `CORS_ALLOWED_ORIGIN`, and your database credentials. Make `backend/storage/logs/` and `backend/public/uploads/` writable by the web server. Uploaded agency logos are saved in `uploads/`, whose `.htaccess` blocks scripts from running there.
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

5. Create the database from `database/schema.sql`, run only the seeders you need, and back the database up regularly (for example, a nightly `mysqldump`).
6. Sign in, change the default password, create named accounts for your staff, and deactivate any accounts you don't need.

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
- [x] Site-wide search, FAQ, privacy policy, and share and print actions
- [x] Admin version history, preview, FAQ and notice management, agency verification, and alerts
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
