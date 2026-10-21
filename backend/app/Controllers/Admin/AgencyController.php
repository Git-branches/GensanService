<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Services\Slug;
use App\Validators\Validator;

class AgencyController
{
    private const EDITORS = ['super_admin', 'editor'];

    public function index(): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            "SELECT a.id, a.name, a.slug, a.acronym, a.description, a.official_website, a.is_local_government, a.is_active,
                    (SELECT COUNT(*) FROM services s WHERE s.agency_id = a.id) AS service_count,
                    (SELECT COUNT(*) FROM services s WHERE s.agency_id = a.id AND s.status = 'published') AS published_count,
                    (SELECT COUNT(*) FROM offices o WHERE o.agency_id = a.id) AS office_count
             FROM agencies a
             ORDER BY a.is_active DESC, a.name"
        )->fetchAll();

        Response::success($rows);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO agencies (name, slug, acronym, description, official_website, is_local_government, is_active)
             VALUES (:name, :slug, :acronym, :description, :website, :local, :active)'
        )->execute($data);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $admin['id'], 'agency.created', 'agency', $id, ['name' => $data['name']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $this->findOrFail($id);
        $data = $this->validate(Request::json(), $id);

        Database::connection()->prepare(
            'UPDATE agencies SET name = :name, slug = :slug, acronym = :acronym, description = :description,
                    official_website = :website, is_local_government = :local, is_active = :active
             WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'agency.updated', 'agency', $id, ['name' => $data['name']]);
        Response::success(['id' => $id]);
    }

    private function findOrFail(int $id): void
    {
        $stmt = Database::connection()->prepare('SELECT 1 FROM agencies WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) {
            Response::notFound('Agency not found');
        }
    }

    /** @return array<string, mixed> */
    private function validate(array $body, ?int $id = null): array
    {
        $v = new Validator();
        $pdo = Database::connection();

        $name = $v->string($body['name'] ?? null, 'name', 150, true, 2);
        $v->string($body['slug'] ?? null, 'slug', 160);
        $data = [
            'name' => $name,
            'slug' => Slug::unique($pdo, 'agencies', $body['slug'] ?? null, (string) $name, $id, $v),
            'acronym' => $v->string($body['acronym'] ?? null, 'acronym', 20),
            'description' => $v->string($body['description'] ?? null, 'description', 2000),
            'website' => $v->optionalUrl($body['official_website'] ?? null, 'official_website'),
            'local' => $v->bool($body['is_local_government'] ?? false),
            'active' => $v->bool($body['is_active'] ?? true),
        ];

        // Deactivating an agency would break the agency links on its live guides.
        if ($id !== null && $data['active'] === 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE agency_id = :id AND status = 'published'");
            $stmt->execute(['id' => $id]);
            $published = (int) $stmt->fetchColumn();
            if ($published > 0) {
                $v->add('is_active', "Unpublish or archive this agency's {$published} published guide(s) first.");
            }
        }

        $v->failIfErrors();
        return $data;
    }
}
