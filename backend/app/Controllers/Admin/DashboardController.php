<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Response;

class DashboardController
{
    private const STALE = ServiceController::NEEDS_VERIFICATION;

    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        $statusCounts = $pdo->query('SELECT status, COUNT(*) FROM services GROUP BY status')->fetchAll(\PDO::FETCH_KEY_PAIR);

        $counts = [
            'published' => (int) ($statusCounts['published'] ?? 0),
            'draft' => (int) ($statusCounts['draft'] ?? 0),
            'for_review' => (int) ($statusCounts['for_review'] ?? 0),
            'approved' => (int) ($statusCounts['approved'] ?? 0),
            'archived' => (int) ($statusCounts['archived'] ?? 0),
            'needs_review' => (int) $pdo->query("SELECT COUNT(*) FROM services s WHERE s.status <> 'archived' AND " . self::STALE)->fetchColumn(),
            'overdue' => (int) $pdo->query("SELECT COUNT(*) FROM services WHERE status <> 'archived' AND next_review_at < CURDATE()")->fetchColumn(),
            'agencies' => (int) $pdo->query('SELECT COUNT(*) FROM agencies WHERE is_active = 1')->fetchColumn(),
            'offices' => (int) $pdo->query('SELECT COUNT(*) FROM offices WHERE is_active = 1')->fetchColumn(),
            'open_reports' => (int) $pdo->query("SELECT COUNT(*) FROM content_reports WHERE status IN ('pending', 'reviewing')")->fetchColumn(),
            'unverified_offices' => (int) $pdo->query('SELECT COUNT(*) FROM offices WHERE is_active = 1 AND is_verified = 0')->fetchColumn(),
        ];

        Response::success([
            'counts' => $counts,
            'in_review' => $pdo->query(
                "SELECT s.id, s.title, s.status, s.updated_at, a.acronym AS agency_acronym
                 FROM services s JOIN agencies a ON a.id = s.agency_id
                 WHERE s.status IN ('for_review', 'approved') ORDER BY s.updated_at ASC LIMIT 5"
            )->fetchAll(),
            'recently_published' => $pdo->query(
                "SELECT s.id, s.title, s.published_at, a.acronym AS agency_acronym
                 FROM services s JOIN agencies a ON a.id = s.agency_id
                 WHERE s.status = 'published' AND s.published_at IS NOT NULL ORDER BY s.published_at DESC LIMIT 5"
            )->fetchAll(),
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

    /** Counts for the sidebar, so waiting work is visible from every admin page. */
    public function notifications(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        Response::success([
            'open_reports' => (int) $pdo->query("SELECT COUNT(*) FROM content_reports WHERE status = 'pending'")->fetchColumn(),
            'for_review' => (int) $pdo->query("SELECT COUNT(*) FROM services WHERE status = 'for_review'")->fetchColumn(),
            'approved' => (int) $pdo->query("SELECT COUNT(*) FROM services WHERE status = 'approved'")->fetchColumn(),
        ]);
    }
}
