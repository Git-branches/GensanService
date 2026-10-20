<?php

// Router for PHP's built-in development server.
// Serves existing files as-is; everything else goes through index.php.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $path;

if ($path !== '/' && file_exists($file) && !is_dir($file)) {
    return false;
}

require __DIR__ . '/index.php';
