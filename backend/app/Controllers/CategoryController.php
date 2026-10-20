<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class CategoryController
{
    public function index(): void
    {
        $stmt = Database::connection()->query(
            "SELECT c.id, c.name, c.slug, c.description, c.icon, c.display_order,
                    (SELECT COUNT(*) FROM services s
                     WHERE s.category_id = c.id AND s.status = 'published') AS service_count
             FROM categories c
             WHERE c.is_active = 1
             ORDER BY c.display_order ASC, c.name ASC"
        );

        Response::success($stmt->fetchAll());
    }
}
