<?php

namespace App\Controllers;

use App\Database;
use App\Response;

/** Life events: an ordered list of guides and steps for one situation, such as starting a business. */
class LifeEventController
{
    public function index(): void
    {
        $rows = Database::connection()->query(
            "SELECT e.title, e.slug, e.summary,
                    (SELECT COUNT(*) FROM life_event_steps st WHERE st.life_event_id = e.id) AS step_count
             FROM life_events e
             WHERE e.status = 'published'
             ORDER BY e.display_order ASC, e.title ASC"
        )->fetchAll();

        Response::success(array_map(fn ($row) => ['step_count' => (int) $row['step_count']] + $row, $rows));
    }

    public function show(array $params): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            "SELECT id, title, slug, summary, description, updated_at FROM life_events WHERE slug = :slug AND status = 'published'"
        );
        $stmt->execute(['slug' => $params['slug']]);
        $event = $stmt->fetch();
        if (!$event) {
            Response::notFound('Life event not found');
        }

        // A guide shows only once it is published; until then the step keeps its own title and note.
        $steps = $pdo->prepare(
            "SELECT st.id, st.title, st.note, st.source_url, st.is_optional,
                    s.slug AS guide_slug, s.title AS guide_title, s.verification_status AS guide_verification_status,
                    a.name AS agency_name, a.acronym AS agency_acronym, a.logo_url AS agency_logo_url,
                    a.is_local_government AS agency_is_local
             FROM life_event_steps st
             LEFT JOIN services s ON s.id = st.service_id AND s.status = 'published'
             LEFT JOIN agencies a ON a.id = s.agency_id
             WHERE st.life_event_id = :id
             ORDER BY st.display_order ASC, st.id ASC"
        );
        $steps->execute(['id' => $event['id']]);
        $event['steps'] = array_map(fn ($step) => ['id' => (int) $step['id'], 'is_optional' => (bool) $step['is_optional']] + $step, $steps->fetchAll());
        unset($event['id']);

        Response::success($event);
    }
}
