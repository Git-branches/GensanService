<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Validators\Validator;

class AnnouncementController
{
    private const EDITORS = ['super_admin', 'editor'];
    private const TYPES = ['info', 'maintenance', 'emergency'];

    public function index(): void
    {
        Auth::requireAdmin();
        Response::success(Database::connection()->query(
            "SELECT n.id, n.title, n.message, n.type, n.full_page, n.starts_at, n.ends_at, n.is_published, n.updated_at,
                    (n.is_published = 1 AND (n.starts_at IS NULL OR n.starts_at <= NOW()) AND (n.ends_at IS NULL OR n.ends_at > NOW())) AS is_live
             FROM announcements n
             ORDER BY is_live DESC, n.id DESC"
        )->fetchAll());
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json(), $admin);

        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO announcements (title, message, type, full_page, starts_at, ends_at, is_published, created_by)
             VALUES (:title, :message, :type, :full_page, :starts_at, :ends_at, :is_published, :admin)'
        )->execute($data + ['admin' => $admin['id']]);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $admin['id'], 'notice.created', 'notice', $id, ['title' => $data['title']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $data = $this->validate(Request::json(), $admin);

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT 1 FROM announcements WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) {
            Response::notFound('Notice not found');
        }

        $pdo->prepare(
            'UPDATE announcements SET title = :title, message = :message, type = :type, full_page = :full_page,
                    starts_at = :starts_at, ends_at = :ends_at, is_published = :is_published
             WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'notice.updated', 'notice', $id, ['title' => $data['title']]);
        Response::success(['id' => $id]);
    }

    /** @return array<string, mixed> */
    private function validate(array $body, array $admin): array
    {
        $v = new Validator();
        $type = (string) ($body['type'] ?? '');
        if (!in_array($type, self::TYPES, true)) {
            $v->add('type', 'Choose a notice type.');
        }

        $data = [
            'title' => $v->string($body['title'] ?? null, 'title', 150, true, 3),
            'message' => $v->string($body['message'] ?? null, 'message', 1000, true, 3),
            'type' => $type,
            'full_page' => $v->bool($body['full_page'] ?? false),
            'starts_at' => $this->dateTime($body['starts_at'] ?? null, 'starts_at', $v),
            'ends_at' => $this->dateTime($body['ends_at'] ?? null, 'ends_at', $v),
            'is_published' => $v->bool($body['is_published'] ?? false),
        ];

        if ($data['starts_at'] !== null && $data['ends_at'] !== null && $data['ends_at'] <= $data['starts_at']) {
            $v->add('ends_at', 'The end must be after the start.');
        }
        // A full-page notice hides the guides from residents, so it needs a limit and a super admin.
        if ($data['full_page'] === 1) {
            if ($type !== 'maintenance') {
                $v->add('full_page', 'Only maintenance notices can replace the page.');
            }
            if ($data['ends_at'] === null) {
                $v->add('ends_at', 'Set an end time so the site comes back on its own.');
            }
            if ($admin['role'] !== 'super_admin') {
                $v->add('full_page', 'Only a super admin can replace the page.');
            }
        }

        $v->failIfErrors();
        return $data;
    }

    private function dateTime(mixed $value, string $field, Validator $v): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $parsed = is_string($value) ? \DateTimeImmutable::createFromFormat('Y-m-d\TH:i', substr($value, 0, 16)) : false;
        if ($parsed === false) {
            $v->add($field, 'Enter a valid date and time.');
            return null;
        }
        return $parsed->format('Y-m-d H:i:00');
    }
}
