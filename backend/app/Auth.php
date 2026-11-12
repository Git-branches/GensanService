<?php

namespace App;

class Auth
{
    private const IDLE_TIMEOUT_SECONDS = 2 * 60 * 60;

    // PHP's own session garbage collector must not remove a session before the app's idle timeout.
    // The default (1440 seconds) would sign an admin out after 24 minutes.
    private const SESSION_GC_SECONDS = 3 * 60 * 60;

    // The password published in the old seeder. An account that still uses it must change it before
    // any other admin screen will load, because the password is public in the project's history.
    public const DEFAULT_PASSWORD = 'ChangeMe123!';

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
        ini_set('session.gc_maxlifetime', (string) self::SESSION_GC_SECONDS);
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
        // A password change or reset writes a newer timestamp, which ends every older session.
        $_SESSION['password_changed_at'] = (string) ($admin['password_changed_at'] ?? '');
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
            'SELECT id, name, email, role, password_hash, password_changed_at
             FROM admins WHERE id = :id AND is_active = 1'
        );
        $stmt->execute(['id' => $id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            self::logout();
            return null;
        }

        if ((string) ($admin['password_changed_at'] ?? '') !== (string) ($_SESSION['password_changed_at'] ?? '')) {
            self::logout();
            return null;
        }

        $admin['uses_default_password'] = self::usesDefaultPassword((string) $admin['password_hash']);
        unset($admin['password_hash'], $admin['password_changed_at']);

        return $admin;
    }

    public static function usesDefaultPassword(?string $hash): bool
    {
        return $hash !== null && $hash !== '' && password_verify(self::DEFAULT_PASSWORD, $hash);
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

        // Until the published default password is replaced, only the account screen and sign-out work.
        if (!empty($admin['uses_default_password']) && !self::isPasswordChangeRequest()) {
            Response::error('Change the default password before using the admin panel.', 403);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $token = Request::header('X-CSRF-Token') ?? '';
            if (!hash_equals(self::csrfToken(), $token)) {
                Response::error('Your session token is invalid or expired. Please refresh and try again.', 419);
            }
        }

        return $admin;
    }

    private static function isPasswordChangeRequest(): bool
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        return in_array($path, ['/api/admin/account/password', '/api/admin/logout'], true);
    }
}
