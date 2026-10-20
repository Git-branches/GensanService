<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class StatsController
{
    public function index(): void
    {
        $stmt = Database::connection()->query(
            "SELECT
                (SELECT COUNT(*) FROM services WHERE status = 'published') AS services,
                (SELECT COUNT(*) FROM agencies WHERE is_active = 1) AS agencies,
                (SELECT COUNT(*) FROM offices WHERE is_active = 1) AS offices,
                (SELECT COUNT(*) FROM categories WHERE is_active = 1) AS categories"
        );

        Response::success($stmt->fetch());
    }
}
