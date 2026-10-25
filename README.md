# Andam GenSan

**Be ready before you go.** Andam GenSan is a web guide that helps residents of General Santos City prepare for government transactions. For services from SSS, PhilHealth, Pag-IBIG, PSA, BIR, and the City Government, it lists the requirements, document checklists, step-by-step procedures, and offices to visit.

> **Important:** Andam GenSan is an independent community information platform. It is not an official government website and does not represent, replace, or process applications for any government agency.

## Features

### For residents (no account needed)

- Search and browse service guides by keyword, category, or agency.
- Service guides with eligibility, a document checklist, application steps, fees, processing times, offices, and official sources.
- A checklist with a progress bar that saves on the device and can be printed.
- Directories of agencies and offices, with Google Maps and Waze links.
- A "Report incorrect information" form on every guide. It is protected by a spam trap and a limit of 5 reports per hour per visitor.
- A last-verified date and official source links on every guide.

### For administrators (`/admin`)

- **Dashboard:** published guides, guides needing re-verification (not checked in 6+ months), open reports, unverified offices, and recent activity.
- **Service guides:** create, edit, publish, unpublish, archive, and restore guides. Editing a guide keeps residents' saved checklist ticks.
- **Agencies, offices, and categories:** add and edit them through modal forms. Records are deactivated instead of deleted.
- **Reports:** review corrections sent by residents, mark them as reviewing, resolved, or dismissed, and leave internal notes.
- **Activity log:** every sign-in and change, with who made it, when, and from which IP address.
- **Admin accounts (super admins only):** add staff, assign roles, deactivate accounts, and reset passwords.
- **My account:** change your own password. Accounts still using the default password see a warning on every page until they change it.

| Role | Can do |
|---|---|
| Super admin | Everything, including managing admin accounts |
| Editor | Create, edit, publish, and archive content; handle reports |
| Reviewer | View content and handle reports |

## Technology

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Lucide icons
- **Backend:** PHP 8.2+ JSON API (no framework), PDO, Composer (`vlucas/phpdotenv`)
- **Database:** MySQL 8+ or MariaDB 10.4+

## Project structure

```text
gensan-service-navigator/
├── frontend/                 React app (public site + admin panel)
│   ├── public/               Static files, including .htaccess for Apache hosting
│   └── src/
│       ├── admin/            Admin panel (loaded only when visiting /admin)
│       ├── components/       Shared UI: header, footer, cards, modal, report form
│       ├── pages/            Public pages
│       ├── services/api.js   Public API client
│       └── utils/
├── backend/                  PHP API
│   ├── app/
│   │   ├── Controllers/      Public controllers; Admin/ for the admin API
│   │   ├── Services/         Activity logging, login throttling, slugs
│   │   ├── Validators/
│   │   ├── Auth.php          Sessions, roles, CSRF
│   │   └── Logger.php        Error log (storage/logs/app.log)
│   ├── config/
│   ├── public/               Web root: index.php, router.php (dev server), .htaccess
│   ├── routes/api.php        All API routes
│   └── storage/logs/
├── database/                 schema.sql, migrations/, seeders/ (see database/README.md)
├── system-requirements.md
└── README.md
```

## Local development (Windows + XAMPP)

### Prerequisites

- XAMPP (PHP 8.2+ and MySQL/MariaDB)
- Composer
- Node.js LTS and npm
- Git

### 1. Database

Start MySQL from the XAMPP Control Panel, then from the project root:

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS gensan_service_navigator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root gensan_service_navigator < database/schema.sql
```

Load the starter data (categories, agencies, a sample guide, and a local admin account) by running each file in `database/seeders/` in order. See [database/README.md](database/README.md).

**Updating a database created before October 2026?** Run `database/migrations/015_create_login_attempts_table.sql` and then `016_add_review_fields_to_content_reports.sql`.

### 2. Backend

```bash
cd backend
composer install
copy .env.example .env
```

Edit `.env` if your MySQL user has a password. Then start the API from the `backend` folder:

```bash
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t public public/router.php
```

Check it at <http://127.0.0.1:8000/api/health>. The `router.php` argument is required, because without it PHP's built-in server returns 404 for API routes.

### 3. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite forwards `/api` requests to the PHP server on port 8000.

### 4. Sign in to the admin panel

Go to <http://localhost:5173/admin> and sign in with the seeded account:

- Email: `admin@gensan-service-navigator.local`
- Password: `ChangeMe123!`

This password is published in this repository. Change it right away from **My account**. The panel shows a red warning until you do. Then add your staff from **Admin accounts**.

### Checks

```bash
cd frontend
npm run lint
npm run build
```

## Deployment (Apache + PHP + MySQL)

1. **Build the frontend:** run `npm run build` in `frontend/`. The site is in `frontend/dist/`, including an `.htaccess` file that makes client-side routes like `/services/...` and `/admin` work on reload.
2. **Install the backend:** copy `backend/` to the server, outside the public web folder if possible, then run `composer install --no-dev --optimize-autoloader`.
3. **Configure `backend/.env`:**
   ```ini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain
   CORS_ALLOWED_ORIGIN=
   DB_HOST=...
   DB_DATABASE=...
   DB_USERNAME=...
   DB_PASSWORD=...
   ```
   With `APP_DEBUG=false`, visitors see a generic error message, and details are written to `backend/storage/logs/app.log`. That folder must be writable by the web server.
4. **Serve both from one domain.** The frontend goes at `/`, and the API's `public/` folder goes at `/api`. Example Apache virtual host:
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
   `mod_rewrite` must be enabled, and `mod_headers` is recommended.
5. **Use HTTPS.** In production, session cookies are marked Secure and the API sends an HSTS header.
6. **Database:** create the database from `database/schema.sql`, run only the seeders you need, and back the database up regularly (for example, a nightly `mysqldump`).
7. **Admin accounts:** sign in, change the default password, create accounts for your staff, and deactivate any you don't need.

## Security

- Passwords are hashed with `password_hash()`. Sign-in is blocked for 15 minutes after 5 failed attempts.
- Admin sessions use HttpOnly, SameSite cookies, a new session ID at sign-in and after password changes, and a 2-hour idle timeout.
- Every admin request that changes data needs a CSRF token. Roles are checked on the server for every request.
- All input is validated on the server, and all queries use PDO prepared statements.
- Reports are protected by a honeypot field and a per-IP rate limit.
- Errors are logged instead of shown to visitors in production. The API sends `nosniff`, `X-Frame-Options`, and `Referrer-Policy` headers.
- The site never asks for government account passwords or one-time PINs (OTPs).

## Information accuracy

Every published guide should name the responsible agency and list the requirements, eligibility, and steps. It should include official source links, plus fees and processing times only when they are confirmed. Each guide shows a last-verified date. Guides older than 6 months are flagged for re-verification on the admin dashboard. Office details should be marked verified only after they are confirmed with the office.

## Roadmap

- [x] Phase 1: Project setup and database design
- [x] Phase 2: Public homepage, search, and categories
- [x] Phase 3: Service guide pages and office directory
- [x] Phase 4: PHP REST API and database integration
- [x] Phase 5: Administrator content management, reports, and activity log
- [ ] Phase 6: Optional resident accounts and saved checklists across devices
- [x] Phase 7: Security hardening and deployment setup (automated tests still to come)
- [ ] Phase 8: Add and verify real service guides and office details

## License

A license has not been selected yet. Add one before distributing the source code publicly.
