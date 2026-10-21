<?php

namespace App\Services;

use App\Database;

class LoginThrottle
{
    private const MAX_FAILURES = 5;
    private const WINDOW_MINUTES = 15;

    public static function isLocked(string $email, string $ip): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE succeeded = 0
               AND attempted_at > (NOW() - INTERVAL ' . self::WINDOW_MINUTES . ' MINUTE)
               AND (email = :email OR ip_address = :ip)'
        );
        $stmt->execute(['email' => $email, 'ip' => $ip]);

        return (int) $stmt->fetchColumn() >= self::MAX_FAILURES;
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

    public static function windowMinutes(): int
    {
        return self::WINDOW_MINUTES;
    }
}
