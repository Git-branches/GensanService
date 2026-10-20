<?php

namespace App;

class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(mixed $data, int $status = 200): never
    {
        self::json(['success' => true, 'data' => $data], $status);
    }

    public static function error(string $message, int $status = 400, mixed $details = null): never
    {
        $body = ['success' => false, 'error' => $message];
        if ($details !== null) {
            $body['details'] = $details;
        }
        self::json($body, $status);
    }

    public static function notFound(string $message = 'Resource not found'): never
    {
        self::error($message, 404);
    }
}
