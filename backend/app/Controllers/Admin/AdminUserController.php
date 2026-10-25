<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Validators\Validator;
use PDO;

class AdminUserController
{
    private const ROLES = ['super_admin', 'editor', 'reviewer'];

    public function index(): void
    {
        Auth::requireAdmin(['super_admin']);
        Response::success(Database::connection()->query(
            'SELECT id, name, email, role, is_active, last_login_at, created_at FROM admins ORDER BY is_active DESC, name'
        )->fetchAll());
    }

    public function store(): void
    {
        $actor = Auth::requireAdmin(['super_admin']);
        $body = Request::json();
        $pdo = Database::connection();

        $v = new Validator();
        $data = $this->validateProfile($v, $pdo, $body);
        $password = $v->password($body['password'] ?? null, 'password');
        $v->failIfErrors();

        $pdo->prepare(
            'INSERT INTO admins (name, email, password_hash, role, is_active) VALUES (:name, :email, :hash, :role, :active)'
        )->execute($data + ['hash' => password_hash($password, PASSWORD_DEFAULT)]);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $actor['id'], 'admin.created', 'admin', $id, ['email' => $data['email'], 'role' => $data['role']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $actor = Auth::requireAdmin(['super_admin']);
        $id = (int) $params['id'];
        $pdo = Database::connection();
        $current = $this->findOrFail($pdo, $id);

        $v = new Validator();
        $data = $this->validateProfile($v, $pdo, Request::json(), $id);

        if ($id === (int) $actor['id'] && ($data['role'] !== 'super_admin' || !$data['active'])) {
            $v->add($data['active'] ? 'role' : 'is_active', 'You cannot remove your own super admin access.');
        }
        $wasActiveSuper = $current['role'] === 'super_admin' && (int) $current['is_active'] === 1;
        $staysActiveSuper = $data['role'] === 'super_admin' && $data['active'] === 1;
        if ($wasActiveSuper && !$staysActiveSuper && $this->activeSuperAdminCount($pdo) <= 1) {
            $v->add('role', 'At least one active super admin is required.');
        }
        $v->failIfErrors();

        $pdo->prepare(
            'UPDATE admins SET name = :name, email = :email, role = :role, is_active = :active WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $actor['id'], 'admin.updated', 'admin', $id, [
            'email' => $data['email'],
            'role' => $data['role'],
            'active' => (bool) $data['active'],
        ]);
        Response::success(['id' => $id]);
    }

    public function resetPassword(array $params): void
    {
        $actor = Auth::requireAdmin(['super_admin']);
        $id = (int) $params['id'];
        $pdo = Database::connection();
        $target = $this->findOrFail($pdo, $id);

        $v = new Validator();
        $password = $v->password(Request::json()['password'] ?? null, 'password');
        $v->failIfErrors();

        $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id')
            ->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $id]);

        ActivityLogger::log((int) $actor['id'], 'admin.password_reset', 'admin', $id, ['email' => $target['email']]);
        Response::success(['id' => $id]);
    }

    /** @return array<string, mixed> */
    private function validateProfile(Validator $v, PDO $pdo, array $body, ?int $id = null): array
    {
        $name = $v->string($body['name'] ?? null, 'name', 100, true, 2);
        $email = strtolower((string) $v->email($body['email'] ?? null, 'email'));
        if ($email === '') {
            $v->add('email', 'Enter an email address.');
        } else {
            $stmt = $pdo->prepare('SELECT 1 FROM admins WHERE email = :email AND id <> :id');
            $stmt->execute(['email' => $email, 'id' => $id ?? 0]);
            if ($stmt->fetchColumn()) {
                $v->add('email', 'Another admin already uses this email.');
            }
        }

        $role = (string) ($body['role'] ?? '');
        if (!in_array($role, self::ROLES, true)) {
            $v->add('role', 'Choose a role.');
        }

        return ['name' => $name, 'email' => $email, 'role' => $role, 'active' => $v->bool($body['is_active'] ?? true)];
    }

    /** @return array<string, mixed> */
    private function findOrFail(PDO $pdo, int $id): array
    {
        $stmt = $pdo->prepare('SELECT id, email, role, is_active FROM admins WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $admin = $stmt->fetch();
        if (!$admin) {
            Response::notFound('Admin not found');
        }
        return $admin;
    }

    private function activeSuperAdminCount(PDO $pdo): int
    {
        return (int) $pdo->query("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND is_active = 1")->fetchColumn();
    }
}
