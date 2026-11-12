# Operations runbook

For the live site on InfinityFree. The free plan has no cron, no email, no SSH, and a 50,000-hit
daily limit, so the routines below are written around those limits. Commands marked *local* run on
your own computer, not on the server.

## 1. Routine checks

| When | Check |
|---|---|
| Daily (automatic) | Uptime monitor reports `/api/health` as up |
| Weekly | Open `/api/health`; confirm `"status": "ok"` and read the `warnings` list |
| Weekly | Download a database export and the uploads folder (see below) |
| Monthly | Open the control panel and check hits and disk usage against the free-plan limits |
| Monthly | Confirm the maintenance run is happening (activity log or the endpoint's response) |
| Before every deploy | Back up the database and uploads |

The error log is `htdocs/backend/storage/logs/app.log`. It rotates at 5 MB into `app.log.1` and
`app.log.2`, so the folder stays under about 15 MB. If the site starts returning 500s, read the log
over FTP before changing anything.

## 2. Backups

There is no automatic backup on the free plan. Keep two copies: one on your computer and one in
cloud storage you control.

### Database

1. Open the control panel → phpMyAdmin.
2. Select the site database, open **Export**, choose **Quick** and **SQL**, and download the file.
3. Name it with the date, for example `andam-2026-11-12.sql`.

On a host with SSH, `mysqldump` is faster:

```bash
mysqldump -h sqlXXX.infinityfree.com -u if0_XXXXXXXX -p if0_XXXXXXXX_andam > andam-2026-11-12.sql
```

### Uploads and code

- Download `htdocs/api/uploads/` over FTP. Agency logos live only on the server and are not in Git.
- The code is in Git. Tag each release, for example `git tag deploy-2026-11-12 && git push --tags`.
- Keep the filled-in `backend/.env` in a password manager, never in Git or the backup zip.

### How long to keep

Keep the last four weekly exports and one export per month for a year. A backup you have never
restored is not a backup, so run the drill below after any major change.

## 3. Restore drill

Do this on a local XAMPP install, never on the live database.

1. Create an empty database:
   `CREATE DATABASE andam_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Import the newest export: `mysql -u root andam_restore < andam-2026-11-12.sql`.
3. Point a local `backend/.env` at `andam_restore` and copy the uploads folder into
   `backend/public/uploads/`.
4. Start the local API and open `http://127.0.0.1:8000/api/health`.
5. Open `/admin`, sign in, and check that a guide, its sources, and an agency logo all load.
6. Drop the restored database when finished.

For a real recovery, repeat steps 1–2 in the live control panel, upload the saved `uploads/`
folder, restore `backend/.env`, and re-run the smoke test in
[DEPLOY-INFINITYFREE.md](DEPLOY-INFINITYFREE.md#6-smoke-test).

## 4. Retention and the maintenance endpoint

The privacy policy states these limits, and `backend/app/Services/Maintenance.php` enforces them:

| Data | Kept for |
|---|---|
| `login_attempts` (admin email and IP) | 30 days |
| `public_rate_limits` (hashed visitor counter) | 2 days |
| `content_reports` that are resolved or dismissed | 12 months after resolution |
| `content_reports` that are still pending or reviewing | 24 months after they were sent |
| `admin_activity_logs` | 24 months |
| `app.log` | rotated at 5 MB, two older files kept |

### Set the token

Generate a long random value *local*:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Add it to `backend/.env` on the server:

```dotenv
MAINTENANCE_TOKEN=PASTE-THE-VALUE
```

Leaving `MAINTENANCE_TOKEN` empty disables the endpoint (it answers 503).

### Call the endpoint

The route is `POST /api/maintenance/run`. Send the token in the `X-Maintenance-Token` header so it
does not appear in URLs or access logs:

```bash
curl -X POST https://YOUR-DOMAIN/api/maintenance/run \
  -H "X-Maintenance-Token: PASTE-THE-VALUE"
```

A successful run returns counts:

```json
{
  "success": true,
  "data": {
    "login_attempts": 0,
    "public_rate_limits": 12,
    "content_reports": 0,
    "admin_activity_logs": 0,
    "log_rotated": 0,
    "ran_at": "2026-11-12T03:00:00+08:00"
  }
}
```

Each run also writes one `system.maintenance` row to the admin activity log. If the token is wrong
the endpoint returns 401; if it is not configured it returns 503.

### Schedule it with cron-job.org

InfinityFree has no cron, so use a free external scheduler:

1. Create an account at <https://cron-job.org>.
2. Add a job with the URL `https://YOUR-DOMAIN/api/maintenance/run`.
3. Set the method to **POST** and add the header `X-Maintenance-Token: PASTE-THE-VALUE`.
   If your plan cannot send headers, use `https://YOUR-DOMAIN/api/maintenance/run?token=PASTE-THE-VALUE`
   instead and rotate the token if it is ever exposed.
4. Run it daily at 03:00 in `Asia/Manila`.
5. Turn on failure notifications so a broken job does not go unnoticed.

If InfinityFree's browser check blocks the scheduler, the endpoint will receive the check page
instead of reaching PHP. In that case run the same `curl` command from your computer once a month,
or move to a host with cron (see [DEPLOY-INFINITYFREE.md](DEPLOY-INFINITYFREE.md#known-limits-of-the-free-plan)).

## 5. Monitoring

Use a free uptime monitor such as <https://uptimerobot.com>:

1. Add an **HTTP(s)** monitor for `https://YOUR-DOMAIN/api/health`.
2. Check every 15 minutes. A 5-minute check is about 288 hits a day; 15 minutes is about 96, which
   leaves more of the 50,000-hit allowance for visitors.
3. Require the keyword `"status":"ok"` in the response, so a 200 page that is really the host's
   browser check does not count as healthy.
4. Send alerts to an address you read on your phone.

Optionally add a second monitor for `https://YOUR-DOMAIN/` and one for `/sitemap.xml`. Do not point a
monitor at the maintenance endpoint; it only accepts POST.

When an alert arrives, start with section 6.

## 6. Incident checklist

### The site returns 500 or a blank page

1. Read `backend/storage/logs/app.log` (and `app.log.1`) over FTP.
2. Open `/api/health`. If it also fails, the problem is in PHP, the database, or `.env`.
3. Check the control panel for a suspended account, exhausted quota, or an expired SSL certificate.
4. If the last change was a deploy, restore the previous `deploy/htdocs` files and the matching
   database export.

### `/api/health` returns 503

The body says the site is not configured. Common causes:

- `APP_ENV=production` together with `APP_DEBUG=true`
- the production database user is `root`
- `pdo_mysql` or `mbstring` is missing
- the database is unreachable or the password in `.env` is wrong

Fix `.env` or the control-panel settings, then reload. The details are also written to `app.log`.

### The database is unreachable

1. Confirm the host name, database name, and user in the control panel match `backend/.env`.
2. Reset the database password in the control panel if needed, then update `.env`.
3. If the database was deleted, recreate it and restore the newest export (section 3).

### Disk or hit quota is full

- Delete old files over FTP, starting with `backend/storage/logs/app.log.*`.
- Export and then trim `site_daily_views` only if you accept losing historical totals.
- The 50,000-hit limit resets daily. Reduce monitoring frequency and confirm the service worker is
  caching assets.

### A staff account may be compromised

1. Sign in as a super admin, open **Admins**, and reset that account's password. This signs it out
   everywhere.
2. Deactivate the account if it is no longer needed.
3. Read the activity log for changes you did not expect.
4. Rotate `MAINTENANCE_TOKEN` and the database password if either may have leaked.

### Bad or harmful content was published

1. Open the guide in `/admin` and unpublish it.
2. Resolve the related report and note what changed.
3. If a logo or uploaded file is involved, delete it from `htdocs/api/uploads/` over FTP.

### SSL certificate expired

Reissue the free certificate in the control panel, then confirm `https://YOUR-DOMAIN/api/health`
loads without a browser warning. Set a calendar reminder for the next renewal.

## 7. Deploy checklist

1. Back up the database and `htdocs/api/uploads/`.
2. Run the API tests against a throwaway database, then `npm run lint`, `npm test`, and
   `npm run build` in `frontend/`.
3. Build the upload folder with the local API running: `npm run deploy:prepare`.
4. Upload the contents of `deploy/htdocs/`, keeping the server's `backend/.env` and `api/uploads/`.
5. Import any new migration before opening the site.
6. Run the smoke test in [DEPLOY-INFINITYFREE.md](DEPLOY-INFINITYFREE.md#6-smoke-test).
7. Tag the release in Git.
