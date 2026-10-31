<?php

namespace App\Controllers;

use App\Database;
use App\Response;
use App\Services\ServiceSearch;

class ServiceController
{
    private const POPULAR = 'SELECT service_id, SUM(views) AS total FROM service_daily_views
                             WHERE view_date >= (CURDATE() - INTERVAL 30 DAY) GROUP BY service_id';
    private const RELATED_LIMIT = 4;

    public function index(): void
    {
        $pdo = Database::connection();

        $search = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 100);
        $categorySlug = trim((string) ($_GET['category'] ?? ''));
        $agencySlug = trim((string) ($_GET['agency'] ?? ''));
        $sort = (string) ($_GET['sort'] ?? '');
        $limit = filter_var($_GET['limit'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 50],
        ]);

        $conditions = ["s.status = 'published'"];
        $bindings = [];

        if ($search !== '') {
            [$condition, $searchBindings] = ServiceSearch::condition($search);
            $conditions[] = $condition;
            $bindings += $searchBindings;
        }

        if ($categorySlug !== '') {
            $conditions[] = 'c.slug = :category_slug';
            $bindings['category_slug'] = $categorySlug;
        }

        if ($agencySlug !== '') {
            $conditions[] = 'a.slug = :agency_slug';
            $bindings['agency_slug'] = $agencySlug;
        }

        $sql = 'SELECT s.id, s.title, s.slug, s.summary, s.fee_description, s.processing_time_description,
                       s.last_verified_at, s.verification_status,
                       c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                       a.name AS agency_name, a.slug AS agency_slug, a.acronym AS agency_acronym
                FROM services s
                JOIN categories c ON c.id = s.category_id
                JOIN agencies a ON a.id = s.agency_id
                ' . ($sort === 'popular' ? 'JOIN (' . self::POPULAR . ') pv ON pv.service_id = s.id' : '') . '
                WHERE ' . implode(' AND ', $conditions) . '
                ORDER BY ' . match (true) {
                    $sort === 'recent' => 's.updated_at DESC',
                    $sort === 'popular' => 'pv.total DESC, s.title ASC',
                    $search !== '' => '(s.title LIKE :rank) DESC, s.title ASC',
                    default => 's.title ASC',
                }
                . ($limit ? ' LIMIT ' . $limit : '');

        if ($search !== '' && !in_array($sort, ['recent', 'popular'], true)) {
            $bindings['rank'] = ServiceSearch::like($search);
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);

        Response::success($stmt->fetchAll());
    }

    /** Adds one to today's total for a guide. No IP address or visitor identifier is stored. */
    public function recordView(array $params): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = :slug AND status = 'published'");
        $stmt->execute(['slug' => $params['slug']]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            Response::notFound('Service not found');
        }

        $pdo->prepare(
            'INSERT INTO service_daily_views (service_id, view_date, views) VALUES (:id, CURDATE(), 1)
             ON DUPLICATE KEY UPDATE views = views + 1'
        )->execute(['id' => $id]);

        Response::success(['recorded' => true]);
    }

    public function show(array $params): void
    {
        $this->respond('s.slug = :key AND s.status = "published"', $params['slug']);
    }

    /** The resident view of any guide, for admins previewing an unpublished one. Callers must check access. */
    public function preview(int $id): void
    {
        $this->respond('s.id = :key', $id);
    }

    private function respond(string $where, string|int $key): void
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'SELECT s.id, s.title, s.slug, s.summary, s.description, s.fee_description,
                    s.processing_time_description, s.last_verified_at, s.verification_status,
                    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
                    c.icon AS category_icon,
                    a.id AS agency_id, a.name AS agency_name, a.slug AS agency_slug,
                    a.acronym AS agency_acronym, a.official_website AS agency_website
             FROM services s
             JOIN categories c ON c.id = s.category_id
             JOIN agencies a ON a.id = s.agency_id
             WHERE ' . $where
        );
        $stmt->execute(['key' => $key]);
        $service = $stmt->fetch();

        if (!$service) {
            Response::notFound('Service not found');
        }

        $serviceId = $service['id'];

        $eligibilityStmt = $pdo->prepare(
            'SELECT condition_text FROM service_eligibility WHERE service_id = :id ORDER BY display_order ASC'
        );
        $eligibilityStmt->execute(['id' => $serviceId]);
        $service['eligibility'] = array_column($eligibilityStmt->fetchAll(), 'condition_text');

        $requirementsStmt = $pdo->prepare(
            'SELECT r.id, r.requirement_text, r.notes, r.is_optional,
                    ls.slug AS linked_slug, ls.title AS linked_title
             FROM service_requirements r
             LEFT JOIN services ls ON ls.id = r.linked_service_id AND ls.status = "published"
             WHERE r.service_id = :id ORDER BY r.display_order ASC'
        );
        $requirementsStmt->execute(['id' => $serviceId]);
        $service['requirements'] = $requirementsStmt->fetchAll();

        $stepsStmt = $pdo->prepare(
            'SELECT step_number, title, instructions
             FROM service_steps WHERE service_id = :id ORDER BY step_number ASC'
        );
        $stepsStmt->execute(['id' => $serviceId]);
        $service['steps'] = $stepsStmt->fetchAll();

        $sourcesStmt = $pdo->prepare(
            'SELECT label, url, verified_at
             FROM service_sources WHERE service_id = :id ORDER BY id ASC'
        );
        $sourcesStmt->execute(['id' => $serviceId]);
        $service['sources'] = $sourcesStmt->fetchAll();

        $officesStmt = $pdo->prepare(
            'SELECT o.id, o.name, o.address, o.barangay, o.city, o.contact_number, o.email,
                    o.opening_hours, o.latitude, o.longitude, o.is_verified, o.last_verified_at
             FROM offices o
             JOIN service_offices so ON so.office_id = o.id
             WHERE so.service_id = :id AND o.is_active = 1
             ORDER BY o.name ASC'
        );
        $officesStmt->execute(['id' => $serviceId]);
        $service['offices'] = $officesStmt->fetchAll();
        $service['related'] = $this->related($pdo, (int) $serviceId, (int) $service['category_id']);

        Response::success($service);
    }

    /** Guides an editor linked, in either direction, or else others in the same category. */
    private function related(\PDO $pdo, int $id, int $categoryId): array
    {
        $columns = 'SELECT s.title, s.slug, s.summary, s.last_verified_at, s.verification_status,
                           c.name AS category_name, c.icon AS category_icon,
                           a.name AS agency_name, a.acronym AS agency_acronym
                    FROM services s
                    JOIN categories c ON c.id = s.category_id
                    JOIN agencies a ON a.id = s.agency_id';
        $limit = self::RELATED_LIMIT;

        $stmt = $pdo->prepare(
            "{$columns}
             WHERE s.status = 'published' AND s.id IN (
                 SELECT related_service_id FROM service_related WHERE service_id = :id1
                 UNION
                 SELECT service_id FROM service_related WHERE related_service_id = :id2
             )
             ORDER BY s.title ASC LIMIT {$limit}"
        );
        $stmt->execute(['id1' => $id, 'id2' => $id]);
        $related = $stmt->fetchAll();
        if ($related !== []) {
            return $related;
        }

        $stmt = $pdo->prepare(
            "{$columns}
             WHERE s.status = 'published' AND s.category_id = :category AND s.id <> :id
             ORDER BY s.title ASC LIMIT {$limit}"
        );
        $stmt->execute(['category' => $categoryId, 'id' => $id]);
        return $stmt->fetchAll();
    }
}
