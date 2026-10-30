<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Services\Slug;
use App\Validators\Validator;

class CategoryController
{
    private const EDITORS = ['super_admin', 'editor'];

    // Must match the icon names the frontend can render (frontend/src/utils/icons.js).
    private const ICONS = ['file-text', 'shield', 'heart-pulse', 'home', 'briefcase', 'receipt', 'id-card', 'hard-hat', 'car', 'graduation-cap', 'landmark'];

    public function index(): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            "SELECT c.id, c.name, c.slug, c.description, c.icon, c.display_order, c.is_active,
                    (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id) AS service_count,
                    (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.status = 'published') AS published_count
             FROM categories c
             ORDER BY c.is_active DESC, c.display_order, c.name"
        )->fetchAll();

        Response::success($rows);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO categories (name, slug, description, icon, display_order, is_active)
             VALUES (:name, :slug, :description, :icon, :display_order, :is_active)'
        )->execute($data);
        $id = (int) $pdo->lastInsertId();

        ActivityLogger::log((int) $admin['id'], 'category.created', 'category', $id, ['name' => $data['name']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];

        $stmt = Database::connection()->prepare('SELECT 1 FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) {
            Response::notFound('Category not found');
        }

        $data = $this->validate(Request::json(), $id);
        Database::connection()->prepare(
            'UPDATE categories SET name = :name, slug = :slug, description = :description, icon = :icon,
                    display_order = :display_order, is_active = :is_active
             WHERE id = :id'
        )->execute($data + ['id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'category.updated', 'category', $id, ['name' => $data['name']]);
        Response::success(['id' => $id]);
    }

    /** @return array<string, mixed> */
    private function validate(array $body, ?int $id = null): array
    {
        $v = new Validator();
        $pdo = Database::connection();

        $name = $v->string($body['name'] ?? null, 'name', 100, true, 2);
        $v->string($body['slug'] ?? null, 'slug', 120);
        $icon = $body['icon'] ?? null;
        if ($icon !== null && $icon !== '' && !in_array($icon, self::ICONS, true)) {
            $v->add('icon', 'Choose one of the available icons.');
        }

        $data = [
            'name' => $name,
            'slug' => Slug::unique($pdo, 'categories', $body['slug'] ?? null, (string) $name, $id, $v),
            'description' => $v->string($body['description'] ?? null, 'description', 255),
            'icon' => $icon ?: null,
            'display_order' => $v->int($body['display_order'] ?? null, 'display_order', 0, 999, 0),
            'is_active' => $v->bool($body['is_active'] ?? true),
        ];

        // Hiding a category would leave its live guides with a category residents can't browse.
        if ($id !== null && $data['is_active'] === 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE category_id = :id AND status = 'published'");
            $stmt->execute(['id' => $id]);
            $published = (int) $stmt->fetchColumn();
            if ($published > 0) {
                $v->add('is_active', "Move or unpublish this category's {$published} published guide(s) first.");
            }
        }

        $v->failIfErrors();
        return $data;
    }
}
