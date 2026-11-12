<?php

namespace App\Services;

use App\Database;
use App\Logger;
use PDO;

/**
 * Deletes rows the site promised not to keep forever, then rotates the log file. Shared hosting has
 * no cron, so the same work runs from /api/maintenance/run when an external scheduler calls it, and
 * the privacy policy describes exactly these limits.
 */
class Maintenance
{
    // login_attempts hold an email and an IP address, so they are kept only long enough to catch
    // repeated failures. Public rate-limit windows are only useful for the current and previous hour.
    public const LOGIN_ATTEMPT_DAYS = 30;
    public const RATE_LIMIT_DAYS = 2;

    // A report that has been handled is kept for a year, in case the same issue comes back. One that
    // is still open is kept for two years, then removed so unanswered reports do not pile up.
    public const RESOLVED_REPORT_MONTHS = 12;
    public const OPEN_REPORT_MONTHS = 24;

    // The admin activity log is an audit trail, so it is kept longer than visitor-facing records.
    public const ACTIVITY_LOG_MONTHS = 24;

    /** @return array<string, int|string> */
    public static function run(): array
    {
        $pdo = Database::connection();

        $deleted = [
            'login_attempts' => self::deleteLoginAttempts($pdo),
            'public_rate_limits' => self::deleteRateLimits($pdo),
            'content_reports' => self::deleteReports($pdo),
            'admin_activity_logs' => self::deleteActivityLogs($pdo),
        ];

        $logRotated = Logger::rotate();

        // Record that the run happened. The row itself counts as activity and is pruned with the rest.
        ActivityLogger::log(null, 'system.maintenance', null, null, [
            'deleted' => $deleted,
            'log_rotated' => $logRotated,
        ]);

        return $deleted + [
            'log_rotated' => $logRotated ? 1 : 0,
            'ran_at' => date(DATE_ATOM),
        ];
    }

    private static function deleteLoginAttempts(PDO $pdo): int
    {
        return $pdo->query(
            'DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL ' . self::LOGIN_ATTEMPT_DAYS . ' DAY)'
        )->rowCount();
    }

    private static function deleteRateLimits(PDO $pdo): int
    {
        return $pdo->query(
            'DELETE FROM public_rate_limits WHERE window_start < (NOW() - INTERVAL ' . self::RATE_LIMIT_DAYS . ' DAY)'
        )->rowCount();
    }

    private static function deleteReports(PDO $pdo): int
    {
        // resolved_at is set when a report is closed; COALESCE covers old rows created before that
        // column existed, which are dated by updated_at instead.
        return $pdo->query(
            'DELETE FROM content_reports
             WHERE (status IN (\'resolved\', \'dismissed\')
                    AND COALESCE(resolved_at, updated_at, created_at) < (NOW() - INTERVAL ' . self::RESOLVED_REPORT_MONTHS . ' MONTH))
                OR (status IN (\'pending\', \'reviewing\')
                    AND created_at < (NOW() - INTERVAL ' . self::OPEN_REPORT_MONTHS . ' MONTH))'
        )->rowCount();
    }

    private static function deleteActivityLogs(PDO $pdo): int
    {
        return $pdo->query(
            'DELETE FROM admin_activity_logs WHERE created_at < (NOW() - INTERVAL ' . self::ACTIVITY_LOG_MONTHS . ' MONTH)'
        )->rowCount();
    }
}
