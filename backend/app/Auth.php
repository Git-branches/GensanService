<?php

namespace App;

class Auth
{
    private const IDLE_TIMEOUT_SECONDS = 2 * 60 * 60;

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $config = require __DIR__ . '/../config/app.php';
        $secure = $config['env'] === 'production' || (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off');

        session_name('andam_admin');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_start();

        $lastActivity = $_SESSION['last_activity'] ?? null;
        if ($lastActivity !== null && time() - $lastActivity > self::IDLE_TIMEOUT_SECONDS) {
            self::logout();
            session_start();
        }
        $_SESSION['last_activity'] = time();
    }

    /** @param array<string, mixed> $admin */
    public static function login(array $admin): void
    {
        self::startSession();
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['last_activity'] = time();
    }

    public static function logout(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        $_SESSION = [];
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => $params['path'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'],
        ]);
        session_destroy();
    }

    /** @return array<string, mixed>|null */
    public static function admin(): ?array
    {
        self::startSession();
        $id = $_SESSION['admin_id'] ?? null;
        if ($id === null) {
            return null;
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, name, email, role FROM admins WHERE id = :id AND is_active = 1'
        );
        $stmt->execute(['id' => $id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            self::logout();
            return null;
        }

        return $admin;
    }

    public static function csrfToken(): string
    {
        self::startSession();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    /**
     * Ends the request with 401/403 unless an active admin with one of the roles is signed in.
     * State-changing requests must also carry a valid X-CSRF-Token header.
     *
     * @param string[] $roles
     * @return array<string, mixed>
     */
    public static function requireAdmin(array $roles = ['super_admin', 'editor', 'reviewer']): array
    {
        $admin = self::admin();
        if ($admin === null) {
            Response::error('Please sign in to continue.', 401);
        }

        if (!in_array($admin['role'], $roles, true)) {
            Response::error('Your role does not allow this action.', 403);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $token = Request::header('X-CSRF-Token') ?? '';
            if (!hash_equals(self::csrfToken(), $token)) {
                Response::error('Your session token is invalid or expired. Please refresh and try again.', 419);
            }
        }

        return $admin;
    }
}
