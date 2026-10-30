<?php

namespace App\Controllers;

use App\Database;
use App\Response;

class FaqController
{
    public function index(): void
    {
        $locale = preg_replace('/[^a-z]/', '', (string) ($_GET['lang'] ?? 'en'));

        // English is the fallback for any question not yet translated.
        $stmt = Database::connection()->prepare(
            "SELECT f.id, f.category,
                    COALESCE(t.question, en.question) AS question,
                    COALESCE(t.answer, en.answer) AS answer
             FROM faqs f
             JOIN faq_translations en ON en.faq_id = f.id AND en.locale = 'en'
             LEFT JOIN faq_translations t ON t.faq_id = f.id AND t.locale = :locale
             WHERE f.is_active = 1
             ORDER BY f.display_order ASC, f.id ASC"
        );
        $stmt->execute(['locale' => $locale]);

        Response::success($stmt->fetchAll());
    }
}
