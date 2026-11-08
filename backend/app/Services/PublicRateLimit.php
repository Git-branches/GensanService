<?php

namespace App\Services;

use App\Database;

/**
 * A small per-hour counter for anonymous public write endpoints (page views, guide views, feedback).
 * The bucket and a hashed identifier keep the table free of raw IP addresses, matching the site's
 * promise that no visitor identifier is stored.
 */
class PublicRateLimit
{
    /** Counts one hit for this bucket and identifier in the current hour. */
    public static function exceeded(string $bucket, string $identifier, int $maxPerHour): bool
    {
        $pdo = Database::connection();
        // Let the database choose the hour window, so PHP and MySQL time zones never disagree.
        $window = "DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')";

        $pdo->prepare(
            "INSERT INTO public_rate_limits (bucket, identifier, window_start, hits)
             VALUES (:bucket, :identifier, {$window}, 1)
             ON DUPLICATE KEY UPDATE hits = hits + 1"
        )->execute(['bucket' => $bucket, 'identifier' => $identifier]);

        $stmt = $pdo->prepare(
            "SELECT hits FROM public_rate_limits
             WHERE bucket = :bucket AND identifier = :identifier AND window_start = {$window}"
        );
        $stmt->execute(['bucket' => $bucket, 'identifier' => $identifier]);
        $hits = (int) $stmt->fetchColumn();

        // Keep the table small without a scheduled job.
        if (random_int(1, 100) === 1) {
            $pdo->exec('DELETE FROM public_rate_limits WHERE window_start < (NOW() - INTERVAL 2 HOUR)');
        }

        return $hits > $maxPerHour;
    }

    /** A stable, non-reversible key for a visitor and, when given, a page. */
    public static function key(string ...$parts): string
    {
        return hash('sha256', implode('|', $parts));
    }
}
