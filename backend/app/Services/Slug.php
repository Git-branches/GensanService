<?php

namespace App\Services;

use App\Validators\Validator;
use PDO;

class Slug
{
    private const TABLES = ['services', 'agencies', 'categories'];

    public static function make(string $text, int $max = 200): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $text) ?? '', '-'));
        return rtrim(mb_substr($slug, 0, $max), '-');
    }

    /**
     * Returns a slug unique within $table. An explicitly chosen slug must already be unique (a validation
     * error is added otherwise); an auto-generated one gets a numeric suffix.
     */
    public static function unique(PDO $pdo, string $table, mixed $requested, string $fallbackText, ?int $excludeId, Validator $v): string
    {
        if (!in_array($table, self::TABLES, true)) {
            throw new \InvalidArgumentException("Unsupported slug table: {$table}");
        }

        $explicit = is_string($requested) && trim($requested) !== '';
        $slug = $explicit ? trim($requested) : self::make($fallbackText);

        if ($explicit && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            $v->add('slug', 'Use lowercase letters, numbers, and hyphens only.');
            return $slug;
        }
        if ($slug === '') {
            $slug = 'item';
        }

        $taken = function (string $candidate) use ($pdo, $table, $excludeId): bool {
            $stmt = $pdo->prepare("SELECT 1 FROM {$table} WHERE slug = :slug AND id <> :id");
            $stmt->execute(['slug' => $candidate, 'id' => $excludeId ?? 0]);
            return (bool) $stmt->fetchColumn();
        };

        if ($explicit) {
            if ($taken($slug)) {
                $v->add('slug', 'Another record already uses this web address.');
            }
            return $slug;
        }

        $candidate = $slug;
        for ($n = 2; $taken($candidate); $n++) {
            $candidate = "{$slug}-{$n}";
        }
        return $candidate;
    }
}
