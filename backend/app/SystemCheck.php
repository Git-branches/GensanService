<?php

namespace App;

/**
 * Checks the settings that turn a working install into an unsafe or broken one. Fatal issues stop the
 * API from starting; warnings are shown by /api/health so they can be fixed without an outage.
 */
class SystemCheck
{
    /** @return string[] */
    public static function fatalIssues(array $config): array
    {
        $issues = [];

        if ($config['env'] === 'production' && $config['debug']) {
            $issues[] = 'APP_DEBUG must be false when APP_ENV=production.';
        }

        $database = require __DIR__ . '/../config/database.php';
        if ($config['env'] === 'production' && strtolower((string) $database['username']) === 'root') {
            $issues[] = 'The production database user must not be root.';
        }

        foreach (['pdo_mysql', 'mbstring'] as $extension) {
            if (!extension_loaded($extension)) {
                $issues[] = "The PHP extension {$extension} is required.";
            }
        }

        return $issues;
    }

    /** @return string[] */
    public static function warnings(array $config): array
    {
        $warnings = [];

        if ($config['site_url'] === '') {
            $warnings[] = 'SITE_URL is empty, so link previews use the address of each request.';
        }

        foreach (['gd', 'fileinfo'] as $extension) {
            if (!extension_loaded($extension)) {
                $warnings[] = "The PHP extension {$extension} is missing; some features are limited.";
            }
        }
        if (extension_loaded('gd') && !function_exists('imagewebp')) {
            $warnings[] = 'GD has no WebP support; logos are saved as PNG instead.';
        }

        if (!is_writable(dirname($config['log_path']))) {
            $warnings[] = 'The log folder is not writable.';
        }
        if (!is_dir($config['uploads_dir']) || !is_writable($config['uploads_dir'])) {
            $warnings[] = 'The uploads folder is missing or not writable.';
        }

        return $warnings;
    }
}
