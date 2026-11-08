<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Response;

class AnalyticsController
{
    private const PERIODS = [7, 30, 90];

    /** Totals from the anonymous daily counts. Every number here is a real count; nothing is estimated. */
    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();
        $days = (int) ($_GET['days'] ?? 30);
        if (!in_array($days, self::PERIODS, true)) {
            $days = 30;
        }

        $to = new \DateTimeImmutable('today');
        $from = $to->modify('-' . ($days - 1) . ' days');
        $range = ['from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d')];
        $where = 'WHERE view_date BETWEEN :from AND :to';

        $group = function (string $column) use ($pdo, $where, $range): array {
            $stmt = $pdo->prepare("SELECT {$column} AS name, SUM(views) AS views FROM site_daily_views {$where} GROUP BY {$column} ORDER BY views DESC");
            $stmt->execute($range);
            return array_map(fn ($row) => ['name' => $row['name'], 'views' => (int) $row['views']], $stmt->fetchAll());
        };

        $daily = $pdo->prepare("SELECT view_date, SUM(views) AS views FROM site_daily_views {$where} GROUP BY view_date");
        $daily->execute($range);
        $byDate = array_map('intval', $daily->fetchAll(\PDO::FETCH_KEY_PAIR));
        // Every day in the period, including days with no visits, so the chart's spacing is true.
        $series = [];
        for ($day = $from; $day <= $to; $day = $day->modify('+1 day')) {
            $key = $day->format('Y-m-d');
            $series[] = ['date' => $key, 'views' => $byDate[$key] ?? 0];
        }

        $guides = $pdo->prepare(
            "SELECT s.title, s.slug, SUM(v.views) AS views
             FROM service_daily_views v JOIN services s ON s.id = v.service_id
             WHERE v.view_date BETWEEN :from AND :to
             GROUP BY s.id, s.title, s.slug ORDER BY views DESC LIMIT 10"
        );
        $guides->execute($range);

        // "Did this guide help?" answers per guide, with the reasons people gave for "No".
        $feedback = $pdo->prepare(
            "SELECT s.title, s.slug, f.helpful, f.reason, SUM(f.answers) AS answers
             FROM service_feedback_daily f JOIN services s ON s.id = f.service_id
             WHERE f.feedback_date BETWEEN :from AND :to
             GROUP BY s.id, s.title, s.slug, f.helpful, f.reason"
        );
        $feedback->execute($range);
        $byGuide = [];
        foreach ($feedback->fetchAll() as $row) {
            $guide = &$byGuide[$row['slug']];
            $guide ??= ['title' => $row['title'], 'slug' => $row['slug'], 'yes' => 0, 'no' => 0, 'reasons' => []];
            $count = (int) $row['answers'];
            if ($row['helpful']) {
                $guide['yes'] += $count;
            } else {
                $guide['no'] += $count;
                if ($row['reason'] !== 'none') {
                    $guide['reasons'][$row['reason']] = ($guide['reasons'][$row['reason']] ?? 0) + $count;
                }
            }
            unset($guide);
        }
        // Guides with the most "No" answers first, since those are the ones to fix.
        usort($byGuide, fn ($a, $b) => [$b['no'], $b['yes']] <=> [$a['no'], $a['yes']]);

        Response::success([
            'days' => $days,
            'from' => $range['from'],
            'to' => $range['to'],
            'total' => array_sum(array_column($series, 'views')),
            'counting_since' => $pdo->query('SELECT MIN(view_date) FROM site_daily_views')->fetchColumn() ?: null,
            'daily' => $series,
            'pages' => $group('page'),
            'locales' => $group('locale'),
            'devices' => $group('device'),
            'top_guides' => array_map(fn ($row) => ['title' => $row['title'], 'slug' => $row['slug'], 'views' => (int) $row['views']], $guides->fetchAll()),
            'feedback' => array_values(array_map(fn ($guide) => ['reasons' => (object) $guide['reasons']] + $guide, $byGuide)),
        ]);
    }
}
