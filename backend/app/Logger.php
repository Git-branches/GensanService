<?php

namespace App;

class Logger
{
    public static function error(\Throwable $e): void
    {
        $config = require __DIR__ . '/../config/app.php';
        $line = sprintf(
            "[%s] %s: %s in %s:%d | %s %s\n%s\n",
            date(DATE_ATOM),
            $e::class,
            $e->getMessage(),
            $e->getFile(),
            $e->getLine(),
            $_SERVER['REQUEST_METHOD'] ?? '-',
            parse_url($_SERVER['REQUEST_URI'] ?? '-', PHP_URL_PATH),
            $e->getTraceAsString()
        );

        // Fall back to PHP's own error log if the storage directory is not writable.
        if (@file_put_contents($config['log_path'], $line, FILE_APPEND | LOCK_EX) === false) {
            error_log($line);
        }
    }
}
