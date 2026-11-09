# Deploying on InfinityFree (shared hosting)

InfinityFree gives you one web root (`htdocs`), Apache with `mod_rewrite`, MariaDB, phpMyAdmin, and
FTP. It has no Node, no Composer, no SSH, and no cron, and the project folder cannot sit above the
web root the way a VirtualHost does. The steps below work around that. The result:

```text
htdocs/                     the built frontend
htdocs/api/index.php        front controller that includes backend/public/index.php
htdocs/api/uploads/         writable; agency logos are served from /api/uploads
htdocs/backend/             the API code, refused over the web by backend/.htaccess
```

Everything in `backend/` except `public/uploads` is unreachable from the browser: `backend/.htaccess`
returns 403 for `app/`, `config/`, `routes/`, `storage/`, `vendor/`, `tests/`, `composer.*`, and `.env`.
Check this after uploading (step 6) — it holds your database password.

## 1. Build the upload folder

From the project root, on your own machine:

```bash
cd backend
composer install --no-dev --optimize-autoloader
cd ../frontend
npm ci
npm run deploy:prepare
```

`deploy:prepare` runs the normal build and then assembles `deploy/htdocs`. It stops with a message if
`dist/` or `backend/vendor/` is missing.

The build pre-renders published guides and life events, so the API must be reachable while it runs.
Start the local API and load its database first (see [Install](../README.md#install)), then build. To
prerender against another address, set `PRERENDER_API_URL`; with no API the build still succeeds with
the shell pages only.

## 2. Create the database

1. In the control panel, create a database. Note the host (`sqlXXX.infinityfree.com`), database name,
   username, and password.
2. Open phpMyAdmin, select that database, and import in this order:
   - `database/schema.sql`
   - `database/seeders/001_seed_categories.sql` through
     `database/seeders/015_seed_life_events.sql`, in numeric order

The migrations in `database/migrations/` are already folded into `schema.sql`. Only an older database
needs them (see [database/README.md](../database/README.md)).

Skip `database/seeders/003_seed_admin.sql` if you would rather create the first account another way.
Keeping it is fine as long as you change the password immediately in step 5.

## 3. Upload over FTP

Upload the **contents of `deploy/htdocs/`** into the site's `htdocs` folder — not the `htdocs` folder
itself, or you will get `htdocs/htdocs`.

Use FTP rather than the file manager, which caps uploads at a few MB per file. The upload is about
2 MB, so it is quick.

## 4. Create `backend/.env`

`deploy/UPLOAD-ME.txt` carries the same template. Placeholders first:

| Setting | Value |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://your-domain` |
| `DB_HOST` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | from step 2 |
| `CORS_ALLOWED_ORIGIN` | empty |
| `TRUSTED_PROXIES` | empty |
| `SITE_URL` | `https://your-domain` — needed for link previews and the sitemap |
| `FRONTEND_DIST` | absolute path of `htdocs`, such as `/home/vol1_2/if0_12345678/htdocs` |
| `UPLOADS_DIR` | same path plus `/api/uploads` |
| `UPLOADS_URL` | `/api/uploads` (already the default) |

`FRONTEND_DIST` matters: link previews and `sitemap.xml` read the built HTML from that folder. The
default (`frontend/dist`) does not exist in this layout, so previews would answer "Not found" until
it is set. Read the absolute path from the control panel's file manager or your FTP client's address
bar. A relative value is resolved inside the deployed project folder, so use the absolute path.

Make `htdocs/backend/storage/logs/` and `htdocs/api/uploads/` writable (0755 is usually enough; some
hosts want 0775).

## 5. HTTPS first, then sign in

Turn on the free SSL certificate **before** the first sign-in. With `APP_ENV=production` the admin
session cookie is marked `Secure`, so signing in over plain HTTP will appear to work and then drop you
back to the form.

Then open `/admin`, sign in, change the seeded password, and create named accounts for staff.

## 6. Smoke test

- `/` loads, and a guide page survives a refresh
- `/api/health` returns `{"status":"ok"}`
- `/sitemap.xml` and `/robots.txt` return XML/text, not 404
- `/backend/.env` returns **403**, and so does `/backend/config/app.php`
- `/admin` signs in and can save a guide
- Uploading an agency logo saves it and shows it from `/api/uploads/agencies/...`
- A guide link pasted into a chat app shows a title and image (see the caveat below)
- Install the site on a phone and open a saved guide in airplane mode

## Known limits of the free plan

- **50,000 hits per day.** That counts requests, not visits: a first page load is roughly 15 requests,
  and repeat visits are fewer because assets are cached for a year. Expect roughly 2,000 page views a
  day. The control panel shows usage.
- **A browser check (`?i=1`).** InfinityFree sometimes shows a JavaScript check before serving a page.
  Two things to verify in step 6: whether link-preview crawlers get through (if they do not, previews
  stay blank on the free plan), and whether the offline worker caches that page instead of the site.
- **No cron.** Nothing in this project needs a scheduled job, but old rows in `site_daily_views` and
  the log file are never pruned automatically. Export the database and clear `app.log` from time to
  time, and keep an eye on the 5 GB quota.
- **No email.** PHP `mail()` is unavailable. Nothing in the app sends mail, so this only matters if you
  add password resets later.
- **Manual SSL renewal.** The free certificate has to be reissued every few months; set a reminder.
- **Slow first byte.** Static pages come from disk, but every API call is PHP + MariaDB. The client
  caches public reads for a minute, which hides most of it.
- **`.htaccess` differences.** If the site returns 500 after upload, the host rejected a directive.
  Line 1 of the built `.htaccess` to try removing is the HSTS block inside `<If "%{HTTPS} == 'on'">`;
  the PHP side already sends that header. `DirectorySlash Off` is the next candidate. Both can go
  without breaking routing.

If the hit limit or the browser check becomes a problem, the same `deploy/htdocs` folder runs on any
Apache + PHP 8.2 + MySQL host, and a free [alwaysdata](https://www.alwaysdata.com/) account (SSH,
cron, 100 MB) fits comfortably. Nothing in the code is specific to InfinityFree.

## Updating a live site

1. Run `npm run deploy:prepare` again with the updated code.
2. Upload `deploy/htdocs/` over the old files, except `backend/.env` and `api/uploads/` — keep the
   server's copies, or you will lose the database password and every logo.
3. Publish content through `/admin` as normal. New guides appear immediately; their pre-built HTML
   only updates on the next deploy, which is why every crawler request goes to `/api/share` and reads
   the database live.
4. After schema changes, import the new migration in `database/migrations/` first.

Back up before every deploy: phpMyAdmin → Export → SQL, and download `htdocs/api/uploads/`. There is
no automatic backup on the free plan.
