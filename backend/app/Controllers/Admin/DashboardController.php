<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Response;

class DashboardController
{
    private const STALE_DAYS = 180;
    private const STALE = '(s.last_verified_at IS NULL OR s.last_verified_at < (CURDATE() - INTERVAL ' . self::STALE_DAYS . ' DAY))';

    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        $statusCounts = $pdo->query('SELECT status, COUNT(*) FROM services GROUP BY status')->fetchAll(\PDO::FETCH_KEY_PAIR);

        $counts = [
            'published' => (int) ($statusCounts['published'] ?? 0),
            'draft' => (int) ($statusCounts['draft'] ?? 0),
            'archived' => (int) ($statusCounts['archived'] ?? 0),
            'needs_review' => (int) $pdo->query("SELECT COUNT(*) FROM services s WHERE s.status <> 'archived' AND " . self::STALE)->fetchColumn(),
            'open_reports' => (int) $pdo->query("SELECT COUNT(*) FROM content_reports WHERE status IN ('pending', 'reviewing')")->fetchColumn(),
            'unverified_offices' => (int) $pdo->query('SELECT COUNT(*) FROM offices WHERE is_active = 1 AND is_verified = 0')->fetchColumn(),
        ];

        Response::success([
            'counts' => $counts,
            'drafts' => $pdo->query(
                "SELECT s.id, s.title, s.updated_at, a.acronym AS agency_acronym
                 FROM services s JOIN agencies a ON a.id = s.agency_id
                 WHERE s.status = 'draft' ORDER BY s.updated_at DESC LIMIT 5"
            )->fetchAll(),
            'needs_review' => $pdo->query(
                "SELECT s.id, s.title, s.status, s.last_verified_at, a.acronym AS agency_acronym
                 FROM services s JOIN agencies a ON a.id = s.agency_id
                 WHERE s.status <> 'archived' AND " . self::STALE . "
                 ORDER BY s.status = 'published' DESC, s.last_verified_at IS NULL DESC, s.last_verified_at ASC LIMIT 5"
            )->fetchAll(),
            'open_reports' => $pdo->query(
                "SELECT r.id, r.reason, r.status, r.created_at, s.title AS service_title
                 FROM content_reports r JOIN services s ON s.id = r.service_id
                 WHERE r.status IN ('pending', 'reviewing') ORDER BY r.created_at DESC LIMIT 5"
            )->fetchAll(),
            'recent_activity' => ActivityController::fetch($pdo, 'WHERE 1 = 1', [], 8, 0),
        ]);
    }
}
