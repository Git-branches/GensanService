<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class OfficeController
{
    public function index(): void
    {
        $pdo = Database::connection();

        $stmt = $pdo->query(
            'SELECT o.id, o.name, o.branch_type, o.description, o.address, o.barangay, o.city, o.province, o.contact_number, o.email,
                    o.opening_hours, o.latitude, o.longitude, o.is_verified, o.last_verified_at,
                    a.id AS agency_id, a.name AS agency_name, a.acronym AS agency_acronym, a.slug AS agency_slug
             FROM offices o
             JOIN agencies a ON a.id = o.agency_id
             WHERE o.is_active = 1 AND a.is_active = 1
             ORDER BY a.name ASC, o.name ASC'
        );

        $offices = $stmt->fetchAll();

        // Published guides handled at each office.
        $guides = $pdo->query(
            "SELECT so.office_id, s.title, s.slug
             FROM service_offices so
             JOIN services s ON s.id = so.service_id
             WHERE s.status = 'published'
             ORDER BY s.title ASC"
        )->fetchAll();
        $byOffice = [];
        foreach ($guides as $guide) {
            $byOffice[$guide['office_id']][] = ['title' => $guide['title'], 'slug' => $guide['slug']];
        }
        foreach ($offices as &$office) {
            $office['services'] = $byOffice[$office['id']] ?? [];
        }

        Response::success($offices);
    }
}
