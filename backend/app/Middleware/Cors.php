<?php

namespace App\Middleware;

class Cors
{
    public static function handle(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $allowed = $config['cors_allowed_origin'];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Same-origin requests need no CORS headers; only echo back the one configured origin.
        if ($allowed !== '' && $origin === $allowed) {
            header('Access-Control-Allow-Origin: ' . $allowed);
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
