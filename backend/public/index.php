<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Logger;
use App\Middleware\Cors;
use App\Response;
use App\Router;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$appConfig = require __DIR__ . '/../config/app.php';

date_default_timezone_set($appConfig['timezone']);
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Treat PHP warnings and notices as errors so they are logged and never leak into JSON responses.
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $e) use ($appConfig) {
    Logger::error($e);
    Response::error($appConfig['debug'] ? $e->getMessage() : 'Something went wrong on our side. Please try again later.', 500);
});

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
// The share pages reuse the built frontend, which has one inline script and style, so those need
// 'unsafe-inline'. JSON responses ignore this header.
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
// Admin and write endpoints must never be reused. Public reads can be cached briefly by the
// browser, the service worker, and a CDN, which matters on mobile data.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && !str_starts_with($path, '/api/admin')) {
    header('Cache-Control: public, max-age=60, stale-while-revalidate=300');
} else {
    header('Cache-Control: no-store');
}
if ($appConfig['env'] === 'production') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

Cors::handle();

$router = new Router();
require __DIR__ . '/../routes/api.php';

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
