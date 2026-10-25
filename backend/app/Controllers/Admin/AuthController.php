<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Services\LoginThrottle;
use App\Validators\Validator;

class AuthController
{
    // The development password published in the seeder; accounts still using it are prompted to change it.
    private const DEFAULT_PASSWORD = 'ChangeMe123!';

    // Verified against when the email is unknown, so response time doesn't reveal which accounts exist.
    private const DUMMY_HASH = '$2y$10$cP6gvS1OmLWCOyvwrY/or.ZsqYN2SW16yxKuoAp5de4W9tR6NqeAm';

    public function login(): void
    {
        $body = Request::json();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $ip = Request::ip();

        if ($email === '' || $password === '' || mb_strlen($email) > 150 || strlen($password) > 200) {
            Response::error('Enter your email and password.', 422);
        }

        if (LoginThrottle::isLocked($email, $ip)) {
            Response::error(
                'Too many failed attempts. Please wait ' . LoginThrottle::windowMinutes() . ' minutes and try again.',
                429
            );
        }

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT id, name, email, role, password_hash, is_active FROM admins WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch();

        $valid = password_verify($password, $admin['password_hash'] ?? self::DUMMY_HASH);
        if (!$admin || !$valid || !(int) $admin['is_active']) {
            LoginThrottle::record($email, $ip, false);
            Response::error('Incorrect email or password.', 401);
        }

        LoginThrottle::record($email, $ip, true);

        if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
            $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id')
                ->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $admin['id']]);
        }
        $pdo->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id')->execute(['id' => $admin['id']]);

        Auth::login($admin);
        ActivityLogger::log((int) $admin['id'], 'auth.login');

        Response::success([
            'admin' => [
                'id' => (int) $admin['id'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'role' => $admin['role'],
                'uses_default_password' => $password === self::DEFAULT_PASSWORD,
            ],
            'csrf_token' => Auth::csrfToken(),
        ]);
    }

    public function changePassword(): void
    {
        $admin = Auth::requireAdmin();
        $body = Request::json();
        $pdo = Database::connection();

        $stmt = $pdo->prepare('SELECT password_hash FROM admins WHERE id = :id');
        $stmt->execute(['id' => $admin['id']]);
        $hash = (string) $stmt->fetchColumn();

        $v = new Validator();
        if (!password_verify((string) ($body['current_password'] ?? ''), $hash)) {
            $v->add('current_password', 'Your current password is incorrect.');
        }
        $new = $v->password($body['new_password'] ?? null, 'new_password');
        if ($new !== null && password_verify($new, $hash)) {
            $v->add('new_password', 'Choose a password different from your current one.');
        }
        $v->failIfErrors();

        $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id')
            ->execute(['hash' => password_hash($new, PASSWORD_DEFAULT), 'id' => $admin['id']]);

        // New session ID so any copy of the old session cookie stops working.
        Auth::login($admin);
        ActivityLogger::log((int) $admin['id'], 'auth.password_changed');

        Response::success(['changed' => true, 'csrf_token' => Auth::csrfToken()]);
    }

    public function logout(): void
    {
        $admin = Auth::requireAdmin();
        ActivityLogger::log((int) $admin['id'], 'auth.logout');
        Auth::logout();
        Response::success(['signed_out' => true]);
    }

    public function me(): void
    {
        $admin = Auth::admin();
        if ($admin === null) {
            Response::error('Not signed in.', 401);
        }

        $stmt = Database::connection()->prepare('SELECT password_hash FROM admins WHERE id = :id');
        $stmt->execute(['id' => $admin['id']]);
        $admin['uses_default_password'] = password_verify(self::DEFAULT_PASSWORD, (string) $stmt->fetchColumn());

        Response::success(['admin' => $admin, 'csrf_token' => Auth::csrfToken()]);
    }
}
