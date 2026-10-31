<?php

namespace App\Controllers\Admin;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ActivityLogger;
use App\Validators\Validator;

class FaqController
{
    private const EDITORS = ['super_admin', 'editor'];
    private const CATEGORIES = ['about', 'guides', 'directory', 'accuracy'];
    private const LOCALES = ['en', 'ceb', 'fil', 'hil', 'blaan', 'mdh', 'mrw'];

    public function index(): void
    {
        Auth::requireAdmin();
        $pdo = Database::connection();

        $faqs = $pdo->query('SELECT id, category, display_order, is_active FROM faqs ORDER BY display_order, id')->fetchAll();
        $translations = $pdo->query('SELECT faq_id, locale, question, answer FROM faq_translations')->fetchAll();

        $byFaq = [];
        foreach ($translations as $row) {
            $byFaq[$row['faq_id']][$row['locale']] = ['question' => $row['question'], 'answer' => $row['answer']];
        }
        foreach ($faqs as &$faq) {
            $faq['translations'] = $byFaq[$faq['id']] ?? (object) [];
        }

        Response::success($faqs);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT INTO faqs (category, display_order, is_active) VALUES (:category, :display_order, :is_active)')
                ->execute(array_diff_key($data, ['translations' => true]));
            $id = (int) $pdo->lastInsertId();
            $this->saveTranslations($id, $data['translations']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        ActivityLogger::log((int) $admin['id'], 'faq.created', 'faq', $id, ['question' => $data['translations']['en']['question']]);
        Response::success(['id' => $id], 201);
    }

    public function update(array $params): void
    {
        $admin = Auth::requireAdmin(self::EDITORS);
        $id = (int) $params['id'];
        $data = $this->validate(Request::json());

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT 1 FROM faqs WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) {
            Response::notFound('Question not found');
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE faqs SET category = :category, display_order = :display_order, is_active = :is_active WHERE id = :id')
                ->execute(array_diff_key($data, ['translations' => true]) + ['id' => $id]);
            $this->saveTranslations($id, $data['translations']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        ActivityLogger::log((int) $admin['id'], 'faq.updated', 'faq', $id, ['question' => $data['translations']['en']['question']]);
        Response::success(['id' => $id]);
    }

    /** @param array<string, array{question: string, answer: string}> $translations */
    private function saveTranslations(int $id, array $translations): void
    {
        $pdo = Database::connection();
        $pdo->prepare('DELETE FROM faq_translations WHERE faq_id = :id')->execute(['id' => $id]);
        $insert = $pdo->prepare('INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES (:id, :locale, :question, :answer)');
        foreach ($translations as $locale => $text) {
            $insert->execute(['id' => $id, 'locale' => $locale, 'question' => $text['question'], 'answer' => $text['answer']]);
        }
    }

    /** @return array<string, mixed> */
    private function validate(array $body): array
    {
        $v = new Validator();
        $category = (string) ($body['category'] ?? '');
        if (!in_array($category, self::CATEGORIES, true)) {
            $v->add('category', 'Choose a category.');
        }

        // English is required. A language left blank is removed, so it falls back to English.
        $translations = [];
        $submitted = is_array($body['translations'] ?? null) ? $body['translations'] : [];
        foreach (self::LOCALES as $locale) {
            $question = trim((string) ($submitted[$locale]['question'] ?? ''));
            $answer = trim((string) ($submitted[$locale]['answer'] ?? ''));
            if ($locale !== 'en' && $question === '' && $answer === '') {
                continue;
            }
            $translations[$locale] = [
                'question' => $v->string($question, "translations.$locale.question", 255, true, 3),
                'answer' => $v->string($answer, "translations.$locale.answer", 3000, true, 3),
            ];
        }

        $data = [
            'category' => $category,
            'display_order' => $v->int($body['display_order'] ?? null, 'display_order', 0, 9999, 0),
            'is_active' => $v->bool($body['is_active'] ?? true),
            'translations' => $translations,
        ];

        $v->failIfErrors();
        return $data;
    }
}
