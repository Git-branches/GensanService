<?php

namespace App\Services;

/** Builds the search conditions for published guides, shared by the guide list and the site-wide search. */
class ServiceSearch
{
    private const COLUMNS = [
        'title' => 's.title',
        'keywords' => 's.search_keywords',
        'agency' => 'a.name',
        'acronym' => 'a.acronym',
        'category' => 'c.name',
    ];

    /**
     * @return array{0: string, 1: array<string, string>} a condition for the query's s, a, and c tables,
     *         and its bindings. It matches the words typed and any official terms for local words in them.
     */
    public static function condition(string $query): array
    {
        $terms = SearchTerms::expand($query);
        $matches = ['MATCH(s.title, s.summary, s.description) AGAINST (:search IN NATURAL LANGUAGE MODE)'];
        $bindings = ['search' => implode(' ', $terms)];

        foreach ($terms as $i => $term) {
            // Native prepares can't reuse a named placeholder, so each LIKE gets its own.
            $like = self::like($term);
            foreach (self::COLUMNS as $name => $column) {
                $matches[] = "{$column} LIKE :like_{$name}_{$i}";
                $bindings["like_{$name}_{$i}"] = $like;
            }
            $matches[] = "EXISTS (SELECT 1 FROM service_requirements r WHERE r.service_id = s.id AND r.requirement_text LIKE :like_req_{$i})";
            $bindings["like_req_{$i}"] = $like;
        }

        return ['(' . implode(' OR ', $matches) . ')', $bindings];
    }

    public static function like(string $term): string
    {
        return '%' . addcslashes($term, '%_\\') . '%';
    }
}
