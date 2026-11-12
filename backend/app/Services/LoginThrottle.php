<?php

namespace App\Services;

use App\Database;

class LoginThrottle
{
    // Limits are deliberately split. A single stranger can no longer lock a known admin's email by
    // failing five times from their own address: that only locks the (email, address) pair.
    private const MAX_PAIR_FAILURES = 5;
    private const MAX_IP_FAILURES = 20;
    private const MAX_EMAIL_FAILURES = 50;
    private const WINDOW_MINUTES = 15;

    public static function isLocked(string $email, string $ip): bool
    {
        return self::failures('email = :email AND ip_address = :ip', ['email' => $email, 'ip' => $ip]) >= self::MAX_PAIR_FAILURES
            || self::failures('ip_address = :ip', ['ip' => $ip]) >= self::MAX_IP_FAILURES
            || self::failures('email = :email', ['email' => $email]) >= self::MAX_EMAIL_FAILURES;
    }

    /** @param array<string, string> $bindings */
    private static function failures(string $condition, array $bindings): int
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE succeeded = 0
               AND attempted_at > (NOW() - INTERVAL ' . self::WINDOW_MINUTES . ' MINUTE)
               AND ' . $condition
        );
        $stmt->execute($bindings);

        return (int) $stmt->fetchColumn();
    }

    public static function record(string $email, string $ip, bool $succeeded): void
    {
        $pdo = Database::connection();
        $pdo->prepare('INSERT INTO login_attempts (email, ip_address, succeeded) VALUES (:email, :ip, :ok)')
            ->execute(['email' => $email, 'ip' => $ip, 'ok' => $succeeded ? 1 : 0]);

        if ($succeeded) {
            // A successful sign-in clears earlier failures for this account.
            $pdo->prepare('DELETE FROM login_attempts WHERE email = :email AND succeeded = 0')
                ->execute(['email' => $email]);
        }
    }

    /** Removes old rows so the table does not keep IP addresses longer than needed. */
    public static function cleanup(int $days = 30): int
    {
        // $days is an int, so it is safe to place directly in the interval expression.
        $stmt = Database::connection()->query(
            'DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL ' . max(1, $days) . ' DAY)'
        );

        return $stmt->rowCount();
    }

    public static function windowMinutes(): int
    {
        return self::WINDOW_MINUTES;
    }
}
