<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Response;
use PDO;

class ActivityController
{
    private const PER_PAGE = 25;
    private const TYPES = ['auth', 'service', 'agency', 'office', 'category', 'report', 'admin', 'faq', 'notice'];

    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        $conditions = ['1 = 1'];
        $bindings = [];

        $type = (string) ($_GET['type'] ?? '');
        if (in_array($type, self::TYPES, true)) {
            // Actions are namespaced as "<type>.<verb>", e.g. "service.updated".
            $conditions[] = 'l.action LIKE :type';
            $bindings['type'] = $type . '.%';
        }
        $adminId = filter_var($_GET['admin_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($adminId) {
            $conditions[] = 'l.admin_id = :admin_id';
            $bindings['admin_id'] = $adminId;
        }
        $from = (string) ($_GET['from'] ?? '');
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $conditions[] = 'l.created_at >= :from';
            $bindings['from'] = $from;
        }
        $to = (string) ($_GET['to'] ?? '');
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $conditions[] = 'l.created_at < (:to + INTERVAL 1 DAY)';
            $bindings['to'] = $to;
        }
        $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 10000]]) ?: 1;

        $where = 'WHERE ' . implode(' AND ', $conditions);
        $count = $pdo->prepare("SELECT COUNT(*) FROM admin_activity_logs l {$where}");
        $count->execute($bindings);

        Response::success([
            'items' => self::fetch($pdo, $where, $bindings, self::PER_PAGE, ($page - 1) * self::PER_PAGE),
            'page' => $page,
            'per_page' => self::PER_PAGE,
            'total' => (int) $count->fetchColumn(),
            'admins' => $pdo->query('SELECT id, name FROM admins ORDER BY name')->fetchAll(),
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    public static function fetch(PDO $pdo, string $where, array $bindings, int $limit, int $offset): array
    {
        // $limit and $offset are integers computed by the caller, never raw user input.
        $stmt = $pdo->prepare(
            "SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.ip_address, l.created_at, a.name AS admin_name
             FROM admin_activity_logs l
             LEFT JOIN admins a ON a.id = l.admin_id
             {$where}
             ORDER BY l.id DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute($bindings);

        return array_map(function (array $row): array {
            $row['details'] = $row['details'] === null ? null : json_decode($row['details'], true);
            return $row;
        }, $stmt->fetchAll());
    }
}
