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

class ServiceController
{
    private const EDITORS = ['super_admin', 'editor'];
    private const VERIFIERS = ['super_admin', 'reviewer'];
    private const STATUSES = ['draft', 'for_review', 'approved', 'published', 'archived'];
    private const VERIFICATION_STATUSES = ['verified', 'needs_review', 'unverified', 'outdated'];

    // Who may move a guide from one status to another. Editors submit, reviewers approve, super admins publish.
    private const TRANSITIONS = [
        'draft' => ['for_review' => self::EDITORS, 'archived' => self::EDITORS],
        'for_review' => ['approved' => self::VERIFIERS, 'draft' => ['super_admin', 'editor', 'reviewer']],
        'approved' => ['published' => ['super_admin'], 'draft' => ['super_admin', 'editor', 'reviewer']],
        'published' => ['draft' => ['super_admin'], 'archived' => ['super_admin']],
        'archived' => ['draft' => self::EDITORS],
    ];

    // Not yet confirmed, not checked in six months, or past its next review date.
    public const NEEDS_VERIFICATION = "(s.verification_status <> 'verified' OR s.last_verified_at IS NULL
        OR s.last_verified_at < (CURDATE() - INTERVAL 180 DAY) OR s.next_review_at < CURDATE())";

    public function index(): void
    {
        Auth::requireAdmin();

        $search = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 100);
        $status = (string) ($_GET['status'] ?? '');
        $needsReview = ($_GET['needs_review'] ?? '') === '1';

        $conditions = ['1 = 1'];
        $bindings = [];

        if ($search !== '') {
            $conditions[] = '(s.title LIKE :q_title OR a.name LIKE :q_agency OR a.acronym LIKE :q_acronym)';
            $like = '%' . addcslashes($search, '%_\\') . '%';
            $bindings += ['q_title' => $like, 'q_agency' => $like, 'q_acronym' => $like];
        }
        if (in_array($status, self::STATUSES, true)) {
            $conditions[] = 's.status = :status';
            $bindings['status'] = $status;
        }
        if ($needsReview) {
            $conditions[] = "s.status <> 'archived' AND " . self::NEEDS_VERIFICATION;
        }

        $stmt = Database::connection()->prepare(
            'SELECT s.id, s.title, s.slug, s.status, s.last_verified_at, s.verification_status, s.updated_at, s.published_at,
                    a.acronym AS agency_acronym, a.name AS agency_name, c.name AS category_name,
                    u.name AS updated_by_name,
                    ' . self::NEEDS_VERIFICATION . ' AS needs_review
             FROM services s
             JOIN agencies a ON a.id = s.agency_id
             JOIN categories c ON c.id = s.category_id
             LEFT JOIN admins u ON u.id = s.updated_by
             WHERE ' . implode(' AND ', $conditions) . '
             ORDER BY s.updated_at DESC'
        );
        $stmt->execute($bindings);

        Response::success($stmt->fetchAll());
    }

    public function show(array $params): void
    {
        Auth::requireAdmin();
        Response::success($this->load((int) $params['id']));
    }

    public function lookups(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        Response::success([
            'categories' => $pdo->query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY display_order, name')->fetchAll(),
            'agencies' => $pdo->query('SELECT id, name, acronym FROM agencies WHERE is_active = 1 ORDER BY name')->fetchAll(),
            // For linking a requirement to the guide that explains how to get it.
            'services' => $pdo->query("SELECT id, title, status FROM services WHERE status <> 'archived' ORDER BY title")->fetchAll(),
            'offices' => $pdo->query(
                'SELECT o.id, o.name, o.agency_id, a.acronym AS agency_acronym
                 FROM offices o JOIN agencies a ON a.id = o.agency_id
                 WHERE o.is_active = 1 ORDER BY a.name, o.name'
            )->fetchAll(),
        ]);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());
        $pdo = Database::connection();

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                "INSERT INTO services (category_id, agency_id, title, slug, summary, description, search_keywords, fee_description,
                                       processing_time_description, status, created_by, updated_by)
                 VALUES (:category_id, :agency_id, :title, :slug, :summary, :description, :keywords, :fee,
                         :processing, 'draft', :admin, :admin2)"
            )->execute($this->serviceColumns($data) + ['admin' => $admin['id'], 'admin2' => $admin['id']]);

            $id = (int) $pdo->lastInsertId();
            $this->syncChildren($pdo, $id, $data);
            ActivityLogger::log((int) $admin['id'], 'service.created', 'service', $id, ['title' => $data['title']]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::success($this->load($id), 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $current = $this->load($id);
        $this->requireEditable($current, $admin);

        $body = Request::json();
        $data = $this->validate($body, $id);
        $summary = trim((string) ($body['change_summary'] ?? ''));
        $this->replaceContent($id, $current, $data, $admin, mb_substr($summary, 0, 255) ?: null);
        ActivityLogger::log((int) $admin['id'], 'service.updated', 'service', $id, ['title' => $data['title']]);

        Response::success($this->load($id));
    }

    public function revisions(array $params): void
    {
        Auth::requireAdmin();
        $id = (int) $params['id'];
        $this->load($id);

        $stmt = Database::connection()->prepare(
            'SELECT r.id, r.change_summary, r.created_at, a.name AS admin_name
             FROM service_revisions r
             LEFT JOIN admins a ON a.id = r.admin_id
             WHERE r.service_id = :id
             ORDER BY r.id DESC'
        );
        $stmt->execute(['id' => $id]);

        Response::success($stmt->fetchAll());
    }

    public function revision(array $params): void
    {
        Auth::requireAdmin();
        $revision = $this->findRevision((int) $params['id'], (int) $params['revisionId']);
        $revision['snapshot'] = json_decode($revision['snapshot'], true);

        Response::success($revision);
    }

    public function restoreRevision(array $params): void
    {
        $admin = Auth::requireAdmin(['super_admin']);
        $id = (int) $params['id'];
        $current = $this->load($id);
        if ($current['status'] === 'archived') {
            Response::error('Restore this guide to drafts first.', 422);
        }

        $revision = $this->findRevision($id, (int) $params['revisionId']);
        $data = $this->validate((array) json_decode($revision['snapshot'], true), $id);

        // The current content is saved as a revision too, so a restore can itself be undone.
        $this->replaceContent($id, $current, $data, $admin, 'Before restoring the version from ' . $revision['created_at']);
        ActivityLogger::log((int) $admin['id'], 'service.restored', 'service', $id, [
            'title' => $data['title'],
            'from' => $revision['created_at'],
        ]);

        Response::success($this->load($id));
    }

    public function setVerification(array $params): void
    {
        $admin = Auth::requireAdmin(self::VERIFIERS);
        $id = (int) $params['id'];
        $service = $this->load($id);
        $body = Request::json();

        $v = new Validator();
        $status = (string) ($body['verification_status'] ?? '');
        if (!in_array($status, self::VERIFICATION_STATUSES, true)) {
            $v->add('verification_status', 'Choose a verification status.');
        }
        $checked = $v->date($body['last_verified_at'] ?? null, 'last_verified_at');
        $nextReview = $v->date($body['next_review_at'] ?? null, 'next_review_at');
        $notes = $v->string($body['verification_notes'] ?? null, 'verification_notes', 1000);

        if ($checked !== null && $checked > date('Y-m-d')) {
            $v->add('last_verified_at', 'The date cannot be in the future.');
        }
        if ($status === 'verified') {
            if ($checked === null) {
                $v->add('last_verified_at', 'Enter the date this guide was checked against official sources.');
            }
            if ($service['sources'] === []) {
                $v->add('verification_status', 'Add an official source before marking this guide as verified.');
            }
        }
        $v->failIfErrors();

        Database::connection()->prepare(
            'UPDATE services SET verification_status = :status, last_verified_at = :checked, next_review_at = :next_review,
                    verification_notes = :notes, updated_by = :admin
             WHERE id = :id'
        )->execute([
            'status' => $status,
            'checked' => $checked,
            'next_review' => $nextReview,
            'notes' => $notes,
            'admin' => $admin['id'],
            'id' => $id,
        ]);

        ActivityLogger::log((int) $admin['id'], 'service.verification_changed', 'service', $id, [
            'title' => $service['title'],
            'from' => $service['verification_status'],
            'to' => $status,
        ]);

        Response::success($this->load($id));
    }

    public function setStatus(array $params): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $params['id'];
        $service = $this->load($id);
        $status = (string) (Request::json()['status'] ?? '');

        $allowedRoles = self::TRANSITIONS[$service['status']][$status] ?? null;
        if ($allowedRoles === null) {
            Response::error('A guide cannot move from this status to that one.', 422);
        }
        if (!in_array($admin['role'], $allowedRoles, true)) {
            Response::error('Your role does not allow this action.', 403);
        }
        if (in_array($status, ['for_review', 'published'], true) && $service['requirements'] === [] && $service['steps'] === []) {
            Response::error('Add at least one requirement or application step first.', 422);
        }

        Database::connection()->prepare(
            "UPDATE services SET status = :status, updated_by = :admin,
                    published_at = IF(:published = 1, COALESCE(published_at, NOW()), published_at),
                    archived_at = IF(:archived = 1, NOW(), NULL)
             WHERE id = :id"
        )->execute([
            'status' => $status,
            'admin' => $admin['id'],
            'published' => $status === 'published' ? 1 : 0,
            'archived' => $status === 'archived' ? 1 : 0,
            'id' => $id,
        ]);

        ActivityLogger::log((int) $admin['id'], 'service.status_changed', 'service', $id, [
            'title' => $service['title'],
            'from' => $service['status'],
            'to' => $status,
        ]);

        Response::success($this->load($id));
    }

    /** Editors change drafts only, so nothing reaches residents without review. */
    private function requireEditable(array $service, array $admin): void
    {
        if ($service['status'] === 'archived') {
            Response::error('Restore this guide to drafts before editing it.', 422);
        }
        if ($admin['role'] !== 'super_admin' && $service['status'] !== 'draft') {
            Response::error('Move this guide back to draft before editing it. Only a super admin can change a published guide.', 403);
        }
    }

    /** Saves new content, keeping the content it replaces as a revision. */
    private function replaceContent(int $id, array $current, array $data, array $admin, ?string $summary): void
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'INSERT INTO service_revisions (service_id, admin_id, snapshot, change_summary)
                 VALUES (:id, :admin, :snapshot, :summary)'
            )->execute([
                'id' => $id,
                'admin' => $admin['id'],
                'snapshot' => json_encode($current, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'summary' => $summary,
            ]);

            $pdo->prepare(
                'UPDATE services SET category_id = :category_id, agency_id = :agency_id, title = :title, slug = :slug,
                        summary = :summary, description = :description, search_keywords = :keywords, fee_description = :fee,
                        processing_time_description = :processing, updated_by = :admin,
                        verification_status = IF(verification_status = \'verified\', \'needs_review\', verification_status)
                 WHERE id = :id'
            )->execute($this->serviceColumns($data) + ['admin' => $admin['id'], 'id' => $id]);

            $this->syncChildren($pdo, $id, $data);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** @return array<string, mixed> */
    private function findRevision(int $serviceId, int $revisionId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT r.id, r.snapshot, r.change_summary, r.created_at, a.name AS admin_name
             FROM service_revisions r
             LEFT JOIN admins a ON a.id = r.admin_id
             WHERE r.id = :id AND r.service_id = :service_id'
        );
        $stmt->execute(['id' => $revisionId, 'service_id' => $serviceId]);
        $revision = $stmt->fetch();
        if (!$revision) {
            Response::notFound('Revision not found');
        }
        return $revision;
    }

    /** @return array<string, mixed> */
    private function load(int $id): array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT s.id, s.category_id, s.agency_id, s.title, s.slug, s.summary, s.description, s.search_keywords, s.fee_description,
                    s.processing_time_description, s.status, s.last_verified_at, s.verification_status,
                    s.next_review_at, s.verification_notes, s.published_at, s.archived_at,
                    s.created_at, s.updated_at, c.slug AS category_slug, u.name AS updated_by_name
             FROM services s
             JOIN categories c ON c.id = s.category_id
             LEFT JOIN admins u ON u.id = s.updated_by
             WHERE s.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $service = $stmt->fetch();
        if (!$service) {
            Response::notFound('Service guide not found');
        }

        $fetch = function (string $sql) use ($pdo, $id): array {
            $q = $pdo->prepare($sql);
            $q->execute(['id' => $id]);
            return $q->fetchAll();
        };

        $service['eligibility'] = array_column(
            $fetch('SELECT condition_text FROM service_eligibility WHERE service_id = :id ORDER BY display_order, id'),
            'condition_text'
        );
        $service['requirements'] = array_map(
            fn ($r) => [
                'id' => (int) $r['id'],
                'requirement_text' => $r['requirement_text'],
                'notes' => $r['notes'],
                'is_optional' => (bool) $r['is_optional'],
                'linked_service_id' => $r['linked_service_id'] === null ? null : (int) $r['linked_service_id'],
            ],
            $fetch('SELECT id, requirement_text, notes, is_optional, linked_service_id FROM service_requirements WHERE service_id = :id ORDER BY display_order, id')
        );
        $service['steps'] = $fetch('SELECT title, instructions FROM service_steps WHERE service_id = :id ORDER BY step_number');
        $service['sources'] = $fetch('SELECT label, url, verified_at FROM service_sources WHERE service_id = :id ORDER BY id');
        $service['office_ids'] = array_map('intval', array_column(
            $fetch('SELECT office_id FROM service_offices WHERE service_id = :id'),
            'office_id'
        ));
        $service['related_ids'] = array_map('intval', array_column(
            $fetch('SELECT related_service_id FROM service_related WHERE service_id = :id'),
            'related_service_id'
        ));

        return $service;
    }

    /** @return array<string, mixed> */
    private function validate(array $body, ?int $serviceId = null): array
    {
        $v = new Validator();
        $pdo = Database::connection();

        $data = [
            'title' => $v->string($body['title'] ?? null, 'title', 200, true, 3),
            'summary' => $v->string($body['summary'] ?? null, 'summary', 500),
            'description' => $v->string($body['description'] ?? null, 'description', 10000),
            'search_keywords' => $v->string($body['search_keywords'] ?? null, 'search_keywords', 500),
            'fee_description' => $v->string($body['fee_description'] ?? null, 'fee_description', 255),
            'processing_time_description' => $v->string($body['processing_time_description'] ?? null, 'processing_time_description', 255),
            'category_id' => $v->id($body['category_id'] ?? null, 'category_id'),
            'agency_id' => $v->id($body['agency_id'] ?? null, 'agency_id'),
        ];

        if ($data['category_id'] && !$this->exists($pdo, 'categories', $data['category_id'])) {
            $v->add('category_id', 'Please choose a valid category.');
        }
        if ($data['agency_id'] && !$this->exists($pdo, 'agencies', $data['agency_id'])) {
            $v->add('agency_id', 'Please choose a valid agency.');
        }

        $v->string($body['slug'] ?? null, 'slug', 220);
        $data['slug'] = Slug::unique($pdo, 'services', $body['slug'] ?? null, (string) $data['title'], $serviceId, $v);

        $data['eligibility'] = [];
        foreach ($v->list($body['eligibility'] ?? null, 'eligibility', 30) as $i => $text) {
            $value = $v->string($text, "eligibility.$i", 500, true);
            if ($value !== null) {
                $data['eligibility'][] = $value;
            }
        }

        $data['requirements'] = [];
        foreach ($v->list($body['requirements'] ?? null, 'requirements', 50) as $i => $item) {
            $item = is_array($item) ? $item : [];
            $linked = $v->id($item['linked_service_id'] ?? null, "requirements.$i.linked_service_id", false);
            if ($linked !== null && ($linked === $serviceId || !$this->exists($pdo, 'services', $linked))) {
                $v->add("requirements.$i.linked_service_id", 'Choose a different guide to link to.');
            }
            $data['requirements'][] = [
                'id' => $v->id($item['id'] ?? null, "requirements.$i.id", false),
                'requirement_text' => $v->string($item['requirement_text'] ?? null, "requirements.$i.requirement_text", 255, true),
                'notes' => $v->string($item['notes'] ?? null, "requirements.$i.notes", 500),
                'is_optional' => !empty($item['is_optional']) ? 1 : 0,
                'linked_service_id' => $linked,
            ];
        }

        $data['steps'] = [];
        foreach ($v->list($body['steps'] ?? null, 'steps', 40) as $i => $item) {
            $item = is_array($item) ? $item : [];
            $data['steps'][] = [
                'title' => $v->string($item['title'] ?? null, "steps.$i.title", 150, true),
                'instructions' => $v->string($item['instructions'] ?? null, "steps.$i.instructions", 5000),
            ];
        }

        $data['sources'] = [];
        foreach ($v->list($body['sources'] ?? null, 'sources', 20) as $i => $item) {
            $item = is_array($item) ? $item : [];
            $data['sources'][] = [
                'label' => $v->string($item['label'] ?? null, "sources.$i.label", 150),
                'url' => $v->url($item['url'] ?? null, "sources.$i.url"),
                'verified_at' => $v->date($item['verified_at'] ?? null, "sources.$i.verified_at"),
            ];
        }

        $data['office_ids'] = [];
        foreach ($v->list($body['office_ids'] ?? null, 'office_ids', 50) as $officeId) {
            $officeId = filter_var($officeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($officeId === false || !$this->exists($pdo, 'offices', $officeId)) {
                $v->add('office_ids', 'One of the selected offices no longer exists.');
                continue;
            }
            $data['office_ids'][] = $officeId;
        }
        $data['office_ids'] = array_values(array_unique($data['office_ids']));

        $data['related_ids'] = [];
        foreach ($v->list($body['related_ids'] ?? null, 'related_ids', 12) as $relatedId) {
            $relatedId = filter_var($relatedId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($relatedId === false || $relatedId === $serviceId || !$this->exists($pdo, 'services', $relatedId)) {
                $v->add('related_ids', 'One of the related guides is not valid.');
                continue;
            }
            $data['related_ids'][] = $relatedId;
        }
        $data['related_ids'] = array_values(array_unique($data['related_ids']));

        $v->failIfErrors();
        return $data;
    }

    /** @return array<string, mixed> */
    private function serviceColumns(array $data): array
    {
        return [
            'category_id' => $data['category_id'],
            'agency_id' => $data['agency_id'],
            'title' => $data['title'],
            'slug' => $data['slug'],
            'summary' => $data['summary'],
            'description' => $data['description'],
            'keywords' => $data['search_keywords'],
            'fee' => $data['fee_description'],
            'processing' => $data['processing_time_description'],
        ];
    }

    private function syncChildren(PDO $pdo, int $serviceId, array $data): void
    {
        $pdo->prepare('DELETE FROM service_eligibility WHERE service_id = :id')->execute(['id' => $serviceId]);
        $insert = $pdo->prepare('INSERT INTO service_eligibility (service_id, condition_text, display_order) VALUES (:id, :text, :order)');
        foreach ($data['eligibility'] as $i => $text) {
            $insert->execute(['id' => $serviceId, 'text' => $text, 'order' => $i + 1]);
        }

        // Requirements are updated in place (not recreated) so their IDs — and residents' saved checklist progress — survive edits.
        $existing = $pdo->prepare('SELECT id FROM service_requirements WHERE service_id = :id');
        $existing->execute(['id' => $serviceId]);
        $existingIds = array_map('intval', $existing->fetchAll(PDO::FETCH_COLUMN));
        $keptIds = [];
        $update = $pdo->prepare(
            'UPDATE service_requirements SET requirement_text = :text, notes = :notes, linked_service_id = :linked,
                    is_optional = :optional, display_order = :order
             WHERE id = :rid AND service_id = :id'
        );
        $insert = $pdo->prepare(
            'INSERT INTO service_requirements (service_id, requirement_text, notes, linked_service_id, is_optional, display_order)
             VALUES (:id, :text, :notes, :linked, :optional, :order)'
        );
        foreach ($data['requirements'] as $i => $req) {
            $values = [
                'id' => $serviceId, 'text' => $req['requirement_text'], 'notes' => $req['notes'],
                'linked' => $req['linked_service_id'], 'optional' => $req['is_optional'], 'order' => $i + 1,
            ];
            if ($req['id'] !== null && in_array($req['id'], $existingIds, true)) {
                $update->execute($values + ['rid' => $req['id']]);
                $keptIds[] = $req['id'];
            } else {
                $insert->execute($values);
            }
        }
        $removed = array_diff($existingIds, $keptIds);
        if ($removed !== []) {
            $placeholders = implode(',', array_fill(0, count($removed), '?'));
            $pdo->prepare("DELETE FROM service_requirements WHERE service_id = ? AND id IN ($placeholders)")
                ->execute([$serviceId, ...array_values($removed)]);
        }

        $pdo->prepare('DELETE FROM service_steps WHERE service_id = :id')->execute(['id' => $serviceId]);
        $insert = $pdo->prepare('INSERT INTO service_steps (service_id, step_number, title, instructions) VALUES (:id, :n, :title, :instructions)');
        foreach ($data['steps'] as $i => $step) {
            $insert->execute(['id' => $serviceId, 'n' => $i + 1, 'title' => $step['title'], 'instructions' => $step['instructions']]);
        }

        $pdo->prepare('DELETE FROM service_sources WHERE service_id = :id')->execute(['id' => $serviceId]);
        $insert = $pdo->prepare('INSERT INTO service_sources (service_id, label, url, verified_at) VALUES (:id, :label, :url, :verified)');
        foreach ($data['sources'] as $source) {
            $insert->execute(['id' => $serviceId, 'label' => $source['label'], 'url' => $source['url'], 'verified' => $source['verified_at']]);
        }

        $pdo->prepare('DELETE FROM service_offices WHERE service_id = :id')->execute(['id' => $serviceId]);
        $insert = $pdo->prepare('INSERT INTO service_offices (service_id, office_id) VALUES (:id, :office)');
        foreach ($data['office_ids'] as $officeId) {
            $insert->execute(['id' => $serviceId, 'office' => $officeId]);
        }

        $pdo->prepare('DELETE FROM service_related WHERE service_id = :id')->execute(['id' => $serviceId]);
        $insert = $pdo->prepare('INSERT INTO service_related (service_id, related_service_id) VALUES (:id, :related)');
        foreach ($data['related_ids'] as $relatedId) {
            $insert->execute(['id' => $serviceId, 'related' => $relatedId]);
        }
    }

    private function exists(PDO $pdo, string $table, int $id): bool
    {
        // $table is always one of the hard-coded names above, never user input.
        $stmt = $pdo->prepare("SELECT 1 FROM {$table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->fetchColumn();
    }

}
