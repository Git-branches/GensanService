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
- [API](#api)
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

Requirements for government services in the Philippines are scattered across agency websites, Facebook pages, and word of mouth. Residents often find out what's missing only after waiting in line. Andam GenSan collects this information in one place, in plain language, with a printable checklist and a link to the official source for every guide.

### Features

For residents (no account needed):

- Search and browse service guides by keyword, category, or agency.
- Service guides with eligibility, a document checklist, application steps, fees, processing times, offices, and official sources.
- A checklist with a progress bar that saves on the device and can be printed.
- Agency and office directories with Google Maps and Waze links.
- A "Report incorrect information" form on every guide.
- Interface in English, Bisaya, Filipino, or Hiligaynon (see [Languages](#languages)).

For administrators (`/admin`):

- A dashboard of guides needing re-verification (not checked in 6+ months), open reports, drafts, and recent activity.
- Create, edit, publish, unpublish, archive, and restore service guides.
- Manage agencies (with logos), offices, and categories. Records are deactivated, never deleted.
- Review residents' reports, and see an activity log of every sign-in and change.
- Manage admin accounts and roles (super admins only), and change your own password.

| Role | Can do |
|---|---|
| Super admin | Everything, including managing admin accounts |
| Editor | Create, edit, publish, and archive content; handle reports |
| Reviewer | View content and handle reports |

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

If your database was created before October 2026, run `database/migrations/015_create_login_attempts_table.sql` and then `016_add_review_fields_to_content_reports.sql`.

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

## Deployment

1. Build the frontend with `npm run build` in `frontend/`. The output in `frontend/dist/` includes an `.htaccess` file that makes routes like `/services/...` and `/admin` work on reload.
2. Copy `backend/` to the server, outside the public web folder if possible, and run `composer install --no-dev --optimize-autoloader`.
3. In `backend/.env`, set `APP_ENV=production`, `APP_DEBUG=false`, an empty `CORS_ALLOWED_ORIGIN`, and your database credentials. Make `backend/storage/logs/` and `backend/public/uploads/` writable by the web server. Uploaded agency logos are saved in `uploads/`, whose `.htaccess` blocks scripts from running there.
4. Serve both from one HTTPS domain: the frontend at `/` and the API's `public/` folder at `/api`. Enable `mod_rewrite` (`mod_headers` is recommended):

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
- [ ] Automated API tests
- [ ] Optional resident accounts to save checklists across devices
- [ ] Add and verify real service guides and office details

## API

The frontend uses a JSON API under `/api`. Successful responses look like `{ "success": true, "data": ... }`. Errors look like `{ "success": false, "error": "message", "details": { "field": "message" } }`, where `details` lists validation errors by field.

### Public endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Counts of published guides, agencies, offices, and categories |
| GET | `/api/categories` | Active categories with published-guide counts |
| GET | `/api/agencies` | Active agencies with guide and office counts |
| GET | `/api/agencies/{slug}` | One agency and its offices |
| GET | `/api/offices` | Active offices with their agency |
| GET | `/api/services` | Published guides. Query: `q`, `category`, `agency`, `sort=recent`, `limit` (1–50) |
| GET | `/api/services/{slug}` | One published guide with eligibility, requirements, steps, sources, and offices |
| POST | `/api/services/{slug}/reports` | Report incorrect information. Body: `reason`, `message`, optional `email`. Limited to 5 per hour per IP |

### Admin endpoints

All admin endpoints require a signed-in session. Every request except `GET` must send the `X-CSRF-Token` header returned by `/api/admin/login` or `/api/admin/me`. Unless noted, any role can read, and super admins and editors can write.

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Sign in with `email` and `password` |
| POST | `/api/admin/logout` | Sign out |
| GET | `/api/admin/me` | Current admin and CSRF token |
| POST | `/api/admin/account/password` | Change your own password |
| GET | `/api/admin/dashboard` | Dashboard counts and lists |
| GET | `/api/admin/activity` | Activity log. Query: `page`, `type`, `admin_id` |
| GET | `/api/admin/lookups` | Agencies, categories, and offices for form menus |
| GET, POST | `/api/admin/services` | List (query: `q`, `status`, `needs_review`) or create guides |
| GET, PUT | `/api/admin/services/{id}` | Read or update a guide |
| POST | `/api/admin/services/{id}/status` | Set `draft`, `published`, or `archived` |
| GET, POST | `/api/admin/agencies`, `/api/admin/offices`, `/api/admin/categories` | List or create |
| PUT | `/api/admin/agencies/{id}`, `/api/admin/offices/{id}`, `/api/admin/categories/{id}` | Update |
| POST, DELETE | `/api/admin/agencies/{id}/logo` | Upload (multipart field `logo`: PNG, JPG, or WebP up to 2 MB, saved as a 256px WebP) or remove an agency logo |
| GET | `/api/admin/reports` | Reports. Query: `status` (`open`, `pending`, `reviewing`, `resolved`, `dismissed`) |
| PUT | `/api/admin/reports/{id}` | Set a report's `status` and `admin_note` (any role) |
| GET, POST | `/api/admin/admins` | List or create admin accounts (super admins only) |
| PUT | `/api/admin/admins/{id}` | Update an admin's name, email, role, or access (super admins only) |
| POST | `/api/admin/admins/{id}/password` | Reset an admin's password (super admins only) |

## Maintainers

[@Git-branches](https://github.com/Git-branches) (Rhon Jon Romero)

## Contributing

Questions, bug reports, and corrections to service information are welcome as [GitHub issues](https://github.com/Git-branches/GensanService/issues). Pull requests are accepted.

- Run `npm run lint` and `npm run build` in `frontend/` before opening a pull request.
- For changes to service requirements, fees, or office details, link the official source you used.
- Never commit `backend/.env`, real passwords, or personal data.

## License

UNLICENSED © Rhon Jon Romero. No license has been chosen yet, so all rights are reserved.
