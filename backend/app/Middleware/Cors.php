<?php

namespace App\Middleware;

class Cors
{
    public static function handle(): void
    {
        $config = require __DIR__ . '/../../config/app.php';

        header('Access-Control-Allow-Origin: ' . $config['cors_allowed_origin']);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
