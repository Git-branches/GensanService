// Assembles the folder to upload to shared hosting, where the web root is a single htdocs folder and
// /api cannot be aliased to backend/public. Run with `npm run deploy:prepare` from frontend/.
//
//   deploy/htdocs/          the built frontend (frontend/dist)
//   deploy/htdocs/api/      front controller, .htaccess, and the writable uploads folder
//   deploy/htdocs/backend/  the API code, vendor/ included, refused over the web by its .htaccess
//
// Everything else (sources, tests, .claude, .impeccable, node_modules, the local .env) stays behind.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')
const root = resolve(frontend, '..')
const deploy = join(root, 'deploy')
const htdocs = join(deploy, 'htdocs')
const backend = join(root, 'backend')

function fail(message) {
  console.error(`\n${message}\n`)
  process.exit(1)
}

if (!existsSync(join(frontend, 'dist', 'index.html'))) {
  fail('No build found. Run `npm run build` in frontend/ first.')
}
if (!existsSync(join(frontend, 'dist', 'shell.html'))) {
  fail('The build has no shell.html, which link previews need. Run `npm run build` again.')
}
if (!existsSync(join(backend, 'vendor', 'autoload.php'))) {
  fail('backend/vendor is missing. Run `composer install --no-dev` in backend/ first.')
}

rmSync(deploy, { recursive: true, force: true })

// 1. The built site becomes the web root.
cpSync(join(frontend, 'dist'), htdocs, { recursive: true })

// 2. The API: a front controller that includes the real one, plus the files public/ used to serve.
const api = join(htdocs, 'api')
mkdirSync(api, { recursive: true })
writeFileSync(
  join(api, 'index.php'),
  `<?php

// Shared hosting has one web root and no way to alias /api to the backend's public folder, so this
// file answers /api/* and lets the real front controller run from where the code lives. Every path
// inside that file resolves from its own location, so vendor/, config/, routes/, and storage/ all
// keep working from htdocs/backend.
require __DIR__ . '/../backend/public/index.php';
`,
)
cpSync(join(backend, 'public', '.htaccess'), join(api, '.htaccess'))

// 3. Uploads sit beside the front controller, because /api/uploads must be a real folder.
cpSync(join(backend, 'public', 'uploads'), join(api, 'uploads'), { recursive: true })
mkdirSync(join(api, 'uploads', 'agencies'), { recursive: true })

// 4. The API code, minus the local environment file, the tests, and the logs of this machine.
cpSync(backend, join(htdocs, 'backend'), {
  recursive: true,
  filter(source) {
    const path = relative(backend, source).split('\\').join('/')
    if (path === '') return true
    if (path === '.env' || path.startsWith('.env.')) return false
    if (path === 'tests' || path.startsWith('tests/')) return false
    if (path === 'public/router.php') return false
    if (path === 'composer.json' || path === 'composer.lock') return false
    if (path.startsWith('public/uploads')) return false
    if (path.startsWith('storage/logs/') && path.endsWith('.log')) return false
    return true
  },
})

// Writable folders have to exist after an FTP upload, because FTP cannot create empty folders reliably.
mkdirSync(join(htdocs, 'backend', 'storage', 'logs'), { recursive: true })

writeFileSync(join(deploy, 'UPLOAD-ME.txt'), `Andam GenSan on shared hosting (InfinityFree)

Upload the CONTENTS of htdocs/ into the site's htdocs folder over FTP, so the server ends up with:

  htdocs/index.html, assets/, sw.js, ...   the built site
  htdocs/api/index.php                     the API front controller
  htdocs/api/uploads/                      writable; agency logos
  htdocs/backend/                          the API code (blocked from the web by .htaccess)

Then, on the server:

1. Create the database in the control panel, open phpMyAdmin, and import
   database/schema.sql, then database/seeders/001 to 015 in order. Do NOT import
   database/seeders/dev/003_seed_admin.sql: that account is for tests only.
2. Create the first admin. Generate a bcrypt hash on your own computer:
     php -r "echo password_hash('YOUR-STRONG-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
   Then in phpMyAdmin run:
     INSERT INTO admins (name, email, password_hash, role, password_changed_at)
     VALUES ('Your Name', 'you@example.com', 'PASTE-THE-HASH', 'super_admin', NOW());
3. Create backend/.env from the template below. Read the absolute path from the control panel.
4. Turn on the free SSL certificate BEFORE signing in, because production cookies are Secure-only.
5. Open https://YOUR-DOMAIN/api/health and confirm "status": "ok" before signing in at /admin.
   The health check lists missing extensions and unsafe settings.

backend/.env

APP_ENV=production
APP_DEBUG=false
APP_URL=https://YOUR-DOMAIN
APP_TIMEZONE=Asia/Manila

DB_HOST=sqlXXX.infinityfree.com
DB_PORT=3306
DB_DATABASE=if0_XXXXXXXX_andam
DB_USERNAME=if0_XXXXXXXX
DB_PASSWORD=YOUR-DATABASE-PASSWORD

CORS_ALLOWED_ORIGIN=
TRUSTED_PROXIES=
SITE_URL=https://YOUR-DOMAIN

# Absolute path to the folder the domain serves, and to its uploads folder.
FRONTEND_DIST=/home/volX_Y/YOUR-ACCOUNT/htdocs
UPLOADS_DIR=/home/volX_Y/YOUR-ACCOUNT/htdocs/api/uploads
UPLOADS_URL=/api/uploads

# Generate with: php -r "echo bin2hex(random_bytes(32));"
# Used by the external cron job that calls POST /api/maintenance/run. Leave empty to disable it.
MAINTENANCE_TOKEN=

See docs/DEPLOY-INFINITYFREE.md in the repository for the full checklist.
`)

function measure(folder) {
  let files = 0
  let bytes = 0
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const full = join(folder, entry.name)
    if (entry.isDirectory()) {
      const inner = measure(full)
      files += inner.files
      bytes += inner.bytes
    } else {
      files += 1
      bytes += statSync(full).size
    }
  }
  return { files, bytes }
}

const { files, bytes } = measure(htdocs)
console.log(`\nReady to upload: deploy/htdocs (${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MB)`)
console.log('Next: read deploy/UPLOAD-ME.txt, or docs/DEPLOY-INFINITYFREE.md for the full checklist.')
