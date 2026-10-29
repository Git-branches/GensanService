<?php

namespace App\Controllers;

use App\Database;
use App\Response;
use App\Services\SearchTerms;

class ServiceController
{
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
            // The query plus any official terms for local words in it ("sedula" also finds "cedula").
            $terms = SearchTerms::expand($search);
            $matches = ['MATCH(s.title, s.summary, s.description) AGAINST (:search IN NATURAL LANGUAGE MODE)'];
            $bindings['search'] = implode(' ', $terms);
            foreach ($terms as $i => $term) {
                // Native prepares can't reuse a named placeholder, so each LIKE gets its own.
                $like = '%' . addcslashes($term, '%_\\') . '%';
                foreach (['title' => 's.title', 'agency' => 'a.name', 'acronym' => 'a.acronym', 'category' => 'c.name'] as $name => $column) {
                    $matches[] = "{$column} LIKE :like_{$name}_{$i}";
                    $bindings["like_{$name}_{$i}"] = $like;
                }
            }
            $conditions[] = '(' . implode(' OR ', $matches) . ')';
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
                       s.last_verified_at,
                       c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                       a.name AS agency_name, a.slug AS agency_slug, a.acronym AS agency_acronym
                FROM services s
                JOIN categories c ON c.id = s.category_id
                JOIN agencies a ON a.id = s.agency_id
                WHERE ' . implode(' AND ', $conditions) . '
                ORDER BY ' . ($sort === 'recent' ? 's.last_verified_at DESC, s.updated_at DESC' : 's.title ASC')
                . ($limit ? ' LIMIT ' . $limit : '');

        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);

        Response::success($stmt->fetchAll());
    }

    public function show(array $params): void
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'SELECT s.id, s.title, s.slug, s.summary, s.description, s.fee_description,
                    s.processing_time_description, s.last_verified_at,
                    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
                    c.icon AS category_icon,
                    a.id AS agency_id, a.name AS agency_name, a.slug AS agency_slug,
                    a.acronym AS agency_acronym, a.official_website AS agency_website
             FROM services s
             JOIN categories c ON c.id = s.category_id
             JOIN agencies a ON a.id = s.agency_id
             WHERE s.slug = :slug AND s.status = "published"'
        );
        $stmt->execute(['slug' => $params['slug']]);
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

        Response::success($service);
    }
}
