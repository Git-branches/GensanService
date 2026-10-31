<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Validators\Validator;

class ReportController
{
    private const STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'];

    public function index(): void
    {
        Auth::requireAdmin();
        $status = (string) ($_GET['status'] ?? '');

        $where = '';
        $bindings = [];
        if (in_array($status, self::STATUSES, true)) {
            $where = 'WHERE r.status = :status';
            $bindings['status'] = $status;
        } elseif ($status === 'open') {
            $where = "WHERE r.status IN ('pending', 'reviewing')";
        }

        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            "SELECT r.id, r.reason, r.message, r.reporter_email, r.status, r.admin_note, r.resolution, r.created_at, r.resolved_at,
                    s.id AS service_id, s.title AS service_title, s.slug AS service_slug, s.status AS service_status,
                    a.name AS resolved_by_name
             FROM content_reports r
             JOIN services s ON s.id = r.service_id
             LEFT JOIN admins a ON a.id = r.resolved_by
             {$where}
             ORDER BY FIELD(r.status, 'pending', 'reviewing', 'resolved', 'dismissed'), r.created_at DESC"
        );
        $stmt->execute($bindings);

        $counts = $pdo->query('SELECT status, COUNT(*) AS total FROM content_reports GROUP BY status')->fetchAll(\PDO::FETCH_KEY_PAIR);

        Response::success([
            'reports' => $stmt->fetchAll(),
            'counts' => array_merge(array_fill_keys(self::STATUSES, 0), array_map('intval', $counts)),
        ]);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $params['id'];
        $body = Request::json();

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT r.id, r.status, s.title FROM content_reports r JOIN services s ON s.id = r.service_id WHERE r.id = :id');
        $stmt->execute(['id' => $id]);
        $report = $stmt->fetch();
        if (!$report) {
            Response::notFound('Report not found');
        }

        $v = new Validator();
        $status = (string) ($body['status'] ?? '');
        if (!in_array($status, self::STATUSES, true)) {
            $v->add('status', 'Choose a valid status.');
        }
        $note = $v->string($body['admin_note'] ?? null, 'admin_note', 1000);
        $resolution = $v->string($body['resolution'] ?? null, 'resolution', 1000);
        $v->failIfErrors();

        $closed = in_array($status, ['resolved', 'dismissed'], true);
        $pdo->prepare(
            'UPDATE content_reports
             SET status = :status, admin_note = :note, resolution = :resolution,
                 resolved_by = IF(:closed = 1, :admin, NULL),
                 resolved_at = IF(:closed2 = 1, COALESCE(resolved_at, NOW()), NULL)
             WHERE id = :id'
        )->execute(['status' => $status, 'note' => $note, 'resolution' => $resolution, 'closed' => $closed ? 1 : 0, 'closed2' => $closed ? 1 : 0, 'admin' => $admin['id'], 'id' => $id]);

        ActivityLogger::log((int) $admin['id'], 'report.status_changed', 'report', $id, [
            'service' => $report['title'],
            'from' => $report['status'],
            'to' => $status,
        ]);

        Response::success(['id' => $id, 'status' => $status]);
    }
}
