<?php

namespace App;

class Logger
{
    // Shared hosting often has no log rotation tool, and app.log would otherwise grow until the disk
    // quota is full. Keep the current file plus two older ones.
    private const MAX_BYTES = 5 * 1024 * 1024;
    private const KEEP_FILES = 2;

    public static function error(\Throwable $e): void
    {
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

        self::write($line);
    }

    /** A one-line message for configuration problems that are not exceptions. */
    public static function message(string $level, string $message): void
    {
        self::write(sprintf(
            "[%s] %s: %s | %s %s\n",
            date(DATE_ATOM),
            $level,
            $message,
            $_SERVER['REQUEST_METHOD'] ?? '-',
            parse_url($_SERVER['REQUEST_URI'] ?? '-', PHP_URL_PATH)
        ));
    }

    /** Rotates app.log once it reaches the size limit. Returns true when a rotation happened. */
    public static function rotate(): bool
    {
        $config = require __DIR__ . '/../config/app.php';

        return self::rotateFile($config['log_path']);
    }

    private static function write(string $line): void
    {
        $config = require __DIR__ . '/../config/app.php';
        $path = $config['log_path'];

        self::rotateFile($path);

        // Fall back to PHP's own error log if the storage directory is not writable.
        if (@file_put_contents($path, $line, FILE_APPEND | LOCK_EX) === false) {
            error_log($line);
        }
    }

    private static function rotateFile(string $path): bool
    {
        if (!is_file($path) || @filesize($path) < self::MAX_BYTES) {
            return false;
        }

        // app.log.1 is the newest old file and app.log.2 the oldest. Drop the oldest, shift the rest
        // up, then move the current file to app.log.1. unlink first because rename() will not replace
        // an existing file on Windows.
        for ($i = self::KEEP_FILES; $i > 1; $i--) {
            $older = $path . '.' . $i;
            $newer = $path . '.' . ($i - 1);
            if (is_file($older) && !@unlink($older)) {
                return false;
            }
            if (is_file($newer) && !@rename($newer, $older)) {
                return false;
            }
        }

        return @rename($path, $path . '.1');
    }
}
