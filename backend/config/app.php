<?php

return [
    'env' => $_ENV['APP_ENV'] ?? 'local',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN),
    'url' => $_ENV['APP_URL'] ?? 'http://127.0.0.1:8000',
    'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Asia/Manila',
    'cors_allowed_origin' => $_ENV['CORS_ALLOWED_ORIGIN'] ?? 'http://localhost:5173',
];
