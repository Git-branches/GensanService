<?php

namespace App\Services;

use App\Database;
use App\Request;

class ActivityLogger
{
    /** @param array<string, mixed>|null $details */
    public static function log(int $adminId, string $action, ?string $entityType = null, ?int $entityId = null, ?array $details = null): void
    {
        Database::connection()->prepare(
            'INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details, ip_address)
             VALUES (:admin_id, :action, :entity_type, :entity_id, :details, :ip)'
        )->execute([
            'admin_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details === null ? null : json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'ip' => Request::ip(),
        ]);
    }
}
