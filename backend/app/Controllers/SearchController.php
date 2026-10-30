<?php

namespace App\Controllers;

use App\Database;
use App\Response;
use App\Services\SearchTerms;
use App\Services\ServiceSearch;

class SearchController
{
    private const MAX_PER_GROUP = 8;

    /** Site-wide search across guides, agencies, offices, and categories, for suggestions and result pages. */
    public function index(): void
    {
        $query = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 100);
        if (mb_strlen($query) < 2) {
            Response::success(['services' => [], 'agencies' => [], 'offices' => [], 'categories' => []]);
        }

        $pdo = Database::connection();
        $limit = self::MAX_PER_GROUP;

        [$condition, $bindings] = ServiceSearch::condition($query);
        $stmt = $pdo->prepare(
            "SELECT s.title, s.slug, a.acronym AS agency_acronym, c.name AS category_name
             FROM services s
             JOIN categories c ON c.id = s.category_id
             JOIN agencies a ON a.id = s.agency_id
             WHERE s.status = 'published' AND {$condition}
             ORDER BY (s.title LIKE :rank) DESC, s.title ASC
             LIMIT {$limit}"
        );
        $stmt->execute($bindings + ['rank' => ServiceSearch::like($query)]);
        $services = $stmt->fetchAll();

        // The same words, matched against the names in each directory.
        $terms = SearchTerms::expand($query);
        $match = function (array $columns) use ($terms): array {
            $parts = [];
            $values = [];
            foreach ($terms as $i => $term) {
                foreach ($columns as $c => $column) {
                    $parts[] = "{$column} LIKE :term_{$i}_{$c}";
                    $values["term_{$i}_{$c}"] = ServiceSearch::like($term);
                }
            }
            return ['(' . implode(' OR ', $parts) . ')', $values];
        };

        [$condition, $bindings] = $match(['a.name', 'a.acronym']);
        $stmt = $pdo->prepare("SELECT a.name, a.acronym, a.slug FROM agencies a WHERE a.is_active = 1 AND {$condition} ORDER BY a.name LIMIT {$limit}");
        $stmt->execute($bindings);
        $agencies = $stmt->fetchAll();

        [$condition, $bindings] = $match(['o.name', 'o.barangay', 'o.address']);
        $stmt = $pdo->prepare(
            "SELECT o.id, o.name, o.barangay, a.acronym AS agency_acronym, a.slug AS agency_slug
             FROM offices o JOIN agencies a ON a.id = o.agency_id
             WHERE o.is_active = 1 AND a.is_active = 1 AND {$condition} ORDER BY o.name LIMIT {$limit}"
        );
        $stmt->execute($bindings);
        $offices = $stmt->fetchAll();

        [$condition, $bindings] = $match(['c.name']);
        $stmt = $pdo->prepare("SELECT c.name, c.slug FROM categories c WHERE c.is_active = 1 AND {$condition} ORDER BY c.display_order LIMIT {$limit}");
        $stmt->execute($bindings);
        $categories = $stmt->fetchAll();

        Response::success([
            'services' => $services,
            'agencies' => $agencies,
            'offices' => $offices,
            'categories' => $categories,
        ]);
    }
}
