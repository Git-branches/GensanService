<?php

// Paths in .env can be absolute (/home/vol1_2/example/htdocs) or relative to the project root
// (frontend/dist). Shared hosts put the code inside the web root, so this keeps one .env working
// both on a local XAMPP install and on the live server.
$projectRoot = dirname(__DIR__, 2);

$resolvePath = static function (string $value, string $default) use ($projectRoot): string {
    if ($value === '') {
        return $projectRoot . '/' . $default;
    }

    // Absolute paths are used as written: /unix/path, C:\windows\path, \\network\share.
    if (preg_match('#^(/|[A-Za-z]:[\\\\/]|\\\\\\\\)#', $value)) {
        return rtrim($value, '/\\');
    }

    return $projectRoot . '/' . ltrim(trim($value), '/\\');
};

return [
    'env' => $_ENV['APP_ENV'] ?? 'production',
    // Safe default: details of server errors are only shown when APP_DEBUG=true is set explicitly.
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'url' => $_ENV['APP_URL'] ?? 'http://127.0.0.1:8000',
    'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Asia/Manila',
    // Only needed when the frontend is served from a different origin (e.g. the Vite dev server). Leave empty in production.
    'cors_allowed_origin' => $_ENV['CORS_ALLOWED_ORIGIN'] ?? '',
    // Comma-separated IPs or CIDRs of reverse proxies/CDNs you control. Leave empty when the site is
    // served directly; forwarded headers are only trusted from these peers.
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', $_ENV['TRUSTED_PROXIES'] ?? '')))),
    'log_path' => __DIR__ . '/../storage/logs/app.log',
    // The public address of the site, such as https://andamgensan.ph, used in link previews and the sitemap.
    // Leave empty to use the address each request came to.
    'site_url' => $_ENV['SITE_URL'] ?? '',
    // The built frontend, read when filling in link previews. On shared hosting the built site is the
    // web root itself, so set this to that folder's absolute path.
    'frontend_dist' => $resolvePath($_ENV['FRONTEND_DIST'] ?? '', 'frontend/dist'),
    // Uploaded agency logos. Point UPLOADS_DIR at the absolute path of the writable folder the web
    // server serves at /api/uploads (on shared hosting that is the uploads folder inside the API folder).
    'uploads_dir' => $resolvePath($_ENV['UPLOADS_DIR'] ?? '', 'backend/public/uploads'),
    'uploads_url' => rtrim($_ENV['UPLOADS_URL'] ?? '/api/uploads', '/'),
    // Shared hosts have no cron, so an external scheduler calls /api/maintenance/run with this token.
    // Leave it empty to disable the endpoint entirely.
    'maintenance_token' => $_ENV['MAINTENANCE_TOKEN'] ?? '',
];
