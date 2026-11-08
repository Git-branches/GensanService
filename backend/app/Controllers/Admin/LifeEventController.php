<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Services\Slug;
use App\Validators\Validator;
use PDO;

class LifeEventController
{
    private const EDITORS = ['super_admin', 'editor'];
    private const MAX_STEPS = 30;

    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        $events = $pdo->query(
            'SELECT e.id, e.title, e.slug, e.summary, e.description, e.status, e.display_order, e.updated_at, u.name AS updated_by_name
             FROM life_events e LEFT JOIN admins u ON u.id = e.updated_by
             ORDER BY e.display_order ASC, e.title ASC'
        )->fetchAll();

        $steps = $pdo->query(
            'SELECT st.life_event_id, st.service_id, st.title, st.note, st.source_url, st.is_optional, s.status AS service_status
             FROM life_event_steps st LEFT JOIN services s ON s.id = st.service_id
             ORDER BY st.display_order ASC, st.id ASC'
        )->fetchAll();
        $byEvent = [];
        foreach ($steps as $step) {
            $byEvent[$step['life_event_id']][] = [
                'service_id' => $step['service_id'] === null ? null : (int) $step['service_id'],
                'service_status' => $step['service_status'],
                'title' => $step['title'],
                'note' => $step['note'],
                'source_url' => $step['source_url'],
                'is_optional' => (bool) $step['is_optional'],
            ];
        }
        foreach ($events as &$event) {
            $event['steps'] = $byEvent[$event['id']] ?? [];
        }

        Response::success($events);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());
        // Like guides, only a super admin decides what residents already see.
        if ($admin['role'] !== 'super_admin' && $data['status'] === 'published') {
            Response::error('Only a super admin can publish a life event.', 403);
        }
        $pdo = Database::connection();

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'INSERT INTO life_events (title, slug, summary, description, status, display_order, updated_by)
                 VALUES (:title, :slug, :summary, :description, :status, :display_order, :admin)'
            )->execute($this->columns($data) + ['admin' => $admin['id']]);
            $id = (int) $pdo->lastInsertId();
            $this->syncSteps($pdo, $id, $data['steps']);
            ActivityLogger::log((int) $admin['id'], 'life_event.created', 'life_event', $id, ['title' => $data['title']]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $pdo = Database::connection();

        $stmt = $pdo->prepare('SELECT status FROM life_events WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $current = $stmt->fetchColumn();
        if ($current === false) {
            Response::notFound('Life event not found');
        }

        $data = $this->validate(Request::json(), $id);
        // Like guides, only a super admin changes what residents already see.
        if ($admin['role'] !== 'super_admin' && ($current === 'published' || $data['status'] === 'published')) {
            Response::error('Only a super admin can publish or change a published life event.', 403);
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'UPDATE life_events SET title = :title, slug = :slug, summary = :summary, description = :description,
                        status = :status, display_order = :display_order, updated_by = :admin
                 WHERE id = :id'
            )->execute($this->columns($data) + ['admin' => $admin['id'], 'id' => $id]);
            $this->syncSteps($pdo, $id, $data['steps']);
            ActivityLogger::log((int) $admin['id'], 'life_event.updated', 'life_event', $id, ['title' => $data['title']]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::success(['id' => $id]);
    }

    /** @return array<string, mixed> */
    private function validate(array $body, ?int $id = null): array
    {
        $v = new Validator();
        $pdo = Database::connection();

        $data = [
            'title' => $v->string($body['title'] ?? null, 'title', 150, true, 3),
            'summary' => $v->string($body['summary'] ?? null, 'summary', 300),
            'description' => $v->string($body['description'] ?? null, 'description', 5000),
            'status' => in_array($body['status'] ?? 'draft', ['draft', 'published'], true) ? ($body['status'] ?? 'draft') : 'draft',
            'display_order' => $v->int($body['display_order'] ?? 0, 'display_order', 0, 999, 0),
        ];
        $v->string($body['slug'] ?? null, 'slug', 170);
        $data['slug'] = Slug::unique($pdo, 'life_events', $body['slug'] ?? null, (string) $data['title'], $id, $v);

        $data['steps'] = [];
        foreach ($v->list($body['steps'] ?? null, 'steps', self::MAX_STEPS) as $i => $item) {
            $item = is_array($item) ? $item : [];
            $serviceId = $v->id($item['service_id'] ?? null, "steps.$i.service_id", false);
            if ($serviceId !== null) {
                $exists = $pdo->prepare('SELECT 1 FROM services WHERE id = :id');
                $exists->execute(['id' => $serviceId]);
                if (!$exists->fetchColumn()) {
                    $v->add("steps.$i.service_id", 'Choose a guide that still exists.');
                }
            }
            $data['steps'][] = [
                'service_id' => $serviceId,
                'title' => $v->string($item['title'] ?? null, "steps.$i.title", 200, true),
                'note' => $v->string($item['note'] ?? null, "steps.$i.note", 500),
                'source_url' => $v->optionalUrl($item['source_url'] ?? null, "steps.$i.source_url"),
                'is_optional' => $v->bool($item['is_optional'] ?? false),
            ];
        }
        if ($data['status'] === 'published' && $data['steps'] === []) {
            $v->add('steps', 'Add at least one step before publishing.');
        }

        $v->failIfErrors();
        return $data;
    }

    /** @return array<string, mixed> */
    private function columns(array $data): array
    {
        return [
            'title' => $data['title'],
            'slug' => $data['slug'],
            'summary' => $data['summary'],
            'description' => $data['description'],
            'status' => $data['status'],
            'display_order' => $data['display_order'],
        ];
    }

    private function syncSteps(PDO $pdo, int $id, array $steps): void
    {
        $pdo->prepare('DELETE FROM life_event_steps WHERE life_event_id = :id')->execute(['id' => $id]);
        $insert = $pdo->prepare(
            'INSERT INTO life_event_steps (life_event_id, service_id, title, note, source_url, is_optional, display_order)
             VALUES (:event, :service, :title, :note, :source, :optional, :order)'
        );
        foreach ($steps as $i => $step) {
            $insert->execute([
                'event' => $id,
                'service' => $step['service_id'],
                'title' => $step['title'],
                'note' => $step['note'],
                'source' => $step['source_url'],
                'optional' => $step['is_optional'],
                'order' => $i + 1,
            ]);
        }
    }
}
