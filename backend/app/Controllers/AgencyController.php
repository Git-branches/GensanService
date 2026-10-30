<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class AgencyController
{
    private const COUNT_COLUMNS = "
        (SELECT COUNT(*) FROM services s WHERE s.agency_id = a.id AND s.status = 'published') AS service_count,
        (SELECT COUNT(*) FROM offices o WHERE o.agency_id = a.id AND o.is_active = 1) AS office_count";

    public function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT a.id, a.name, a.slug, a.acronym, a.description, a.logo_url, a.official_website,
                    a.presence, a.is_local_government, ' . self::COUNT_COLUMNS . '
             FROM agencies a
             WHERE a.is_active = 1
             ORDER BY a.name ASC'
        );

        Response::success($stmt->fetchAll());
    }

    public function show(array $params): void
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'SELECT a.id, a.name, a.slug, a.acronym, a.description, a.logo_url, a.official_website,
                    a.hotline, a.email, a.facebook_url, a.presence,
                    a.is_local_government, ' . self::COUNT_COLUMNS . '
             FROM agencies a
             WHERE a.slug = :slug AND a.is_active = 1'
        );
        $stmt->execute(['slug' => $params['slug']]);
        $agency = $stmt->fetch();

        if (!$agency) {
            Response::notFound('Agency not found');
        }

        $officesStmt = $pdo->prepare(
            'SELECT id, name, branch_type, description, address, barangay, city, province, contact_number, email, opening_hours,
                    latitude, longitude, is_verified, last_verified_at
             FROM offices
             WHERE agency_id = :agency_id AND is_active = 1
             ORDER BY name ASC'
        );
        $officesStmt->execute(['agency_id' => $agency['id']]);
        $agency['offices'] = $officesStmt->fetchAll();

        Response::success($agency);
    }
}
