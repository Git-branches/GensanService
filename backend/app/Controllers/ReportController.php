<?php

namespace App\Controllers;

use App\Database;
use App\Request;
use App\Response;
use App\Validators\Validator;

class ReportController
{
    public const REASONS = ['outdated_requirements', 'wrong_fee', 'wrong_steps', 'office_details', 'broken_link', 'other'];

    private const MAX_PER_HOUR = 5;

    public function store(array $params): void
    {
        $body = Request::json();

        // Honeypot: real visitors never see or fill the "website" field. Pretend success so bots learn nothing.
        if (trim((string) ($body['website'] ?? '')) !== '') {
            Response::success(['received' => true], 201);
        }

        $pdo = Database::connection();
        $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = :slug AND status = 'published'");
        $stmt->execute(['slug' => $params['slug']]);
        $serviceId = $stmt->fetchColumn();
        if (!$serviceId) {
            Response::notFound('Service not found');
        }

        $ip = Request::ip();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM content_reports WHERE reporter_ip = :ip AND created_at > (NOW() - INTERVAL 1 HOUR)');
        $stmt->execute(['ip' => $ip]);
        if ((int) $stmt->fetchColumn() >= self::MAX_PER_HOUR) {
            Response::error('You have sent several reports recently. Please try again in an hour.', 429);
        }

        $v = new Validator();
        $reason = (string) ($body['reason'] ?? '');
        if (!in_array($reason, self::REASONS, true)) {
            $v->add('reason', 'Please choose what is wrong.');
        }
        $message = $v->string($body['message'] ?? null, 'message', 2000, true, 10);
        $email = $v->email($body['email'] ?? null, 'email');
        $v->failIfErrors();

        $pdo->prepare(
            'INSERT INTO content_reports (service_id, reporter_email, reporter_ip, reason, message)
             VALUES (:service_id, :email, :ip, :reason, :message)'
        )->execute([
            'service_id' => $serviceId,
            'email' => $email,
            'ip' => $ip,
            'reason' => $reason,
            'message' => $message,
        ]);

        Response::success(['received' => true], 201);
    }
}
