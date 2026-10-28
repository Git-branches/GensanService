<?php

// Router for PHP's built-in development server.
// Serves existing files as-is; everything else goes through index.php.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Uploads are requested under /api/uploads, as in production where public/ is served at /api.
if (str_starts_with($path, '/api/uploads/')) {
    $root = realpath(__DIR__ . '/uploads');
    $upload = realpath(__DIR__ . substr($path, strlen('/api')));
    if ($root && $upload && str_starts_with($upload, $root . DIRECTORY_SEPARATOR) && is_file($upload)) {
        header('Content-Type: ' . (mime_content_type($upload) ?: 'application/octet-stream'));
        header('X-Content-Type-Options: nosniff');
        readfile($upload);
    } else {
        http_response_code(404);
    }
    return true;
}
$file = __DIR__ . $path;

if ($path !== '/' && file_exists($file) && !is_dir($file)) {
    return false;
}

require __DIR__ . '/index.php';
