<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class AnnouncementController
{
    /** Notices that should show right now, most urgent first. */
    public function index(): void
    {
        $rows = Database::connection()->query(
            "SELECT id, title, message, type, full_page
             FROM announcements
             WHERE is_published = 1
               AND (starts_at IS NULL OR starts_at <= NOW())
               AND (ends_at IS NULL OR ends_at > NOW())
             ORDER BY FIELD(type, 'emergency', 'maintenance', 'info'), id DESC"
        )->fetchAll();

        Response::success($rows);
    }
}
