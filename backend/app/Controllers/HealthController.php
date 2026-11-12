<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Response;
use App\SystemCheck;

/**
 * A small public check for the uptime monitor and for the launch checklist. It reports whether the
 * database and required extensions work, never credentials or error details.
 */
class HealthController
{
    public function index(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $issues = SystemCheck::fatalIssues($config);
        $warnings = SystemCheck::warnings($config);
        $database = false;

        try {
            $pdo = Database::connection();
            $pdo->query('SELECT 1');
            $database = true;

            // The old seeder created this account with a password published in the repository.
            $stmt = $pdo->prepare('SELECT password_hash FROM admins WHERE email = :email AND is_active = 1');
            $stmt->execute(['email' => 'admin@gensan-service-navigator.local']);
            $hash = (string) $stmt->fetchColumn();
            if ($hash !== '' && Auth::usesDefaultPassword($hash)) {
                $warnings[] = 'The seeded admin still uses the published default password.';
            }
        } catch (\Throwable $e) {
            $issues[] = 'The database is not reachable.';
        }

        $ok = $issues === [];
        Response::json([
            'success' => $ok,
            'data' => [
                'status' => $ok ? 'ok' : 'error',
                'php' => PHP_VERSION,
                'database' => $database,
                'extensions' => [
                    'pdo_mysql' => extension_loaded('pdo_mysql'),
                    'mbstring' => extension_loaded('mbstring'),
                    'fileinfo' => extension_loaded('fileinfo'),
                    'gd' => extension_loaded('gd'),
                    'webp' => function_exists('imagewebp'),
                ],
                'config' => [
                    'env' => $config['env'],
                    'debug' => $config['debug'],
                    'site_url_set' => $config['site_url'] !== '',
                ],
                'issues' => $issues,
                'warnings' => $warnings,
            ],
        ], $ok ? 200 : 503);
    }
}
