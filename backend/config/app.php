<?php

return [
    'env' => $_ENV['APP_ENV'] ?? 'production',
    // Safe default: details of server errors are only shown when APP_DEBUG=true is set explicitly.
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'url' => $_ENV['APP_URL'] ?? 'http://127.0.0.1:8000',
    'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Asia/Manila',
    // Only needed when the frontend is served from a different origin (e.g. the Vite dev server). Leave empty in production.
    'cors_allowed_origin' => $_ENV['CORS_ALLOWED_ORIGIN'] ?? '',
    'log_path' => __DIR__ . '/../storage/logs/app.log',
    // The public address of the site, such as https://andamgensan.ph, used in link previews and the sitemap.
    // Leave empty to use the address each request came to.
    'site_url' => $_ENV['SITE_URL'] ?? '',
    // The built frontend, read when filling in link previews.
    'frontend_dist' => $_ENV['FRONTEND_DIST'] ?? __DIR__ . '/../../frontend/dist',
];
