<?php

namespace App\Controllers;

use App\Request;
use App\Response;
use App\Services\Maintenance;

/**
 * Runs the retention job for hosts without cron. An external scheduler sends a POST with the shared
 * token; nothing here is reachable with a normal admin session, and the response carries counts only.
 */
class MaintenanceController
{
    public function run(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $expected = (string) $config['maintenance_token'];

        if ($expected === '') {
            Response::error('Maintenance is not configured on this server.', 503);
        }

        // The header keeps the token out of URLs and access logs. The query parameter is accepted for
        // schedulers that can only call a URL.
        $provided = Request::header('X-Maintenance-Token') ?? (string) ($_GET['token'] ?? '');
        if ($provided === '' || !hash_equals($expected, $provided)) {
            Response::error('Invalid maintenance token.', 401);
        }

        Response::success(Maintenance::run());
    }
}
