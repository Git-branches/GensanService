<?php

namespace App;

class Request
{
    /** @return array<string, mixed> */
    public static function json(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            return [];
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            Response::error('Request body must be valid JSON', 400);
        }

        return $data;
    }

    public static function ip(): string
    {
        $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $config = require __DIR__ . '/../config/app.php';

        // Behind a proxy or CDN, REMOTE_ADDR is the proxy. Only trust a forwarded address when the
        // direct peer is one we listed, so a visitor cannot choose their own rate-limit key.
        if (self::isTrustedProxy($remote, $config['trusted_proxies'])) {
            foreach (['CF-Connecting-IP', 'X-Forwarded-For'] as $name) {
                $value = self::header($name);
                if ($value === null || $value === '') {
                    continue;
                }
                $candidate = trim(explode(',', $value)[0]);
                if (filter_var($candidate, FILTER_VALIDATE_IP)) {
                    return substr($candidate, 0, 45);
                }
            }
        }

        return substr($remote, 0, 45);
    }

    /** @param string[] $trusted */
    public static function isTrustedProxy(string $ip, array $trusted): bool
    {
        foreach ($trusted as $entry) {
            if ($entry === $ip || (str_contains($entry, '/') && self::inCidr($ip, $entry))) {
                return true;
            }
        }

        return false;
    }

    private static function inCidr(string $ip, string $cidr): bool
    {
        [$subnet, $bits] = array_pad(explode('/', $cidr, 2), 2, '');
        $ipBin = @inet_pton($ip);
        $subnetBin = @inet_pton($subnet);
        if ($ipBin === false || $subnetBin === false || strlen($ipBin) !== strlen($subnetBin)) {
            return false;
        }

        $bits = (int) $bits;
        $maxBits = strlen($ipBin) * 8;
        if ($bits < 0 || $bits > $maxBits) {
            return false;
        }

        $wholeBytes = intdiv($bits, 8);
        if (substr($ipBin, 0, $wholeBytes) !== substr($subnetBin, 0, $wholeBytes)) {
            return false;
        }

        $remainder = $bits % 8;
        if ($remainder === 0) {
            return true;
        }

        $mask = (0xff << (8 - $remainder)) & 0xff;
        return (ord($ipBin[$wholeBytes]) & $mask) === (ord($subnetBin[$wholeBytes]) & $mask);
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return isset($_SERVER[$key]) ? (string) $_SERVER[$key] : null;
    }
}
