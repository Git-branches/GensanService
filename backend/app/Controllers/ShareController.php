<?php

namespace App\Controllers;

use App\Database;

/**
 * Pages for search engines and link previews (Facebook, Messenger, Viber, X). Those do not run JavaScript,
 * so they get the built page with its title, summary, and share image filled in. People never reach this:
 * frontend/public/.htaccess only sends known crawlers here.
 */
class ShareController
{
    private const SITE_NAME = 'Andam GenSan';
    private const STATIC_ROUTES = ['/', '/services', '/agencies', '/offices', '/faq', '/privacy'];

    /** The public address of the site, from SITE_URL or else the address this request came to. */
    public static function origin(): string
    {
        $config = require __DIR__ . '/../../config/app.php';
        if ($config['site_url'] !== '') {
            return rtrim($config['site_url'], '/');
        }
        $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
        $host = preg_replace('/[^a-z0-9.:-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        return ($https ? 'https' : 'http') . '://' . $host;
    }

    public function page(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $path = '/' . trim((string) ($_GET['path'] ?? '/'), '/');
        $path = preg_replace('#[^a-z0-9/_-]#i', '', $path) ?: '/';
        $dist = rtrim($config['frontend_dist'], '/\\');

        $file = in_array($path, self::STATIC_ROUTES, true) ? $dist . ($path === '/' ? '' : $path) . '/index.html' : $dist . '/shell.html';
        $html = is_file($file) ? file_get_contents($file) : false;
        if ($html === false) {
            http_response_code(404);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Not found';
            exit;
        }

        preg_match('#<title>(.*?)</title>#s', $html, $titleMatch);
        preg_match('#<meta\s+name="description"\s+content="([^"]*)"#s', $html, $descriptionMatch);
        $title = html_entity_decode($titleMatch[1] ?? self::SITE_NAME, ENT_QUOTES);
        $description = html_entity_decode(trim($descriptionMatch[1] ?? ''), ENT_QUOTES);
        $status = 200;

        if (preg_match('#^/services/([a-z0-9-]+)$#', $path, $m)) {
            [$status, $title, $description] = $this->guide($m[1], $title, $description);
        } elseif (preg_match('#^/agencies/([a-z0-9-]+)$#', $path, $m)) {
            [$status, $title, $description] = $this->agency($m[1], $title, $description);
        } elseif (!in_array($path, self::STATIC_ROUTES, true)) {
            $status = 404;
        }

        $origin = self::origin();
        $e = fn (string $value) => htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $tags = implode("\n    ", [
            '<link rel="canonical" href="' . $e($origin . ($path === '/' ? '/' : $path)) . '" />',
            '<meta property="og:type" content="website" />',
            '<meta property="og:site_name" content="' . self::SITE_NAME . '" />',
            '<meta property="og:title" content="' . $e($title) . '" />',
            '<meta property="og:description" content="' . $e($description) . '" />',
            '<meta property="og:url" content="' . $e($origin . $path) . '" />',
            '<meta property="og:image" content="' . $e($origin . '/og-image.png') . '" />',
            '<meta property="og:image:width" content="1200" />',
            '<meta property="og:image:height" content="630" />',
            '<meta property="og:image:alt" content="Andam GenSan: know the requirements before you go." />',
            '<meta property="og:locale" content="en_PH" />',
            '<meta name="twitter:card" content="summary_large_image" />',
        ]);

        // Replace the generic title and description, drop any earlier preview tags, then add these.
        $html = preg_replace('#<title>.*?</title>#s', '<title>' . $e($title) . '</title>', $html, 1);
        $html = preg_replace('#<meta\s+name="description"\s+content="[^"]*"\s*/?>#s', '<meta name="description" content="' . $e($description) . '" />', $html, 1);
        $html = preg_replace('#\s*<meta\s+(property="og:[^"]*"|name="twitter:[^"]*")[^>]*>#', '', $html);
        $html = preg_replace('#\s*<link\s+rel="canonical"[^>]*>#', '', $html);
        $html = str_replace('</head>', "    {$tags}\n  </head>", $html);

        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: public, max-age=600');
        echo $html;
        exit;
    }

    /** @return array{int, string, string} */
    private function guide(string $slug, string $title, string $description): array
    {
        $stmt = Database::connection()->prepare(
            "SELECT s.title, s.summary, a.acronym, a.name FROM services s JOIN agencies a ON a.id = s.agency_id
             WHERE s.slug = :slug AND s.status = 'published'"
        );
        $stmt->execute(['slug' => $slug]);
        $guide = $stmt->fetch();
        if (!$guide) {
            return [404, $title, $description];
        }
        $agency = $guide['acronym'] ?: $guide['name'];
        $summary = trim((string) $guide['summary']) ?: 'What to bring, what it costs, and where to go in General Santos City.';
        return [200, "{$guide['title']} ({$agency}) · " . self::SITE_NAME, $summary];
    }

    /** @return array{int, string, string} */
    private function agency(string $slug, string $title, string $description): array
    {
        $stmt = Database::connection()->prepare('SELECT name, acronym, description FROM agencies WHERE slug = :slug AND is_active = 1');
        $stmt->execute(['slug' => $slug]);
        $agency = $stmt->fetch();
        if (!$agency) {
            return [404, $title, $description];
        }
        $name = $agency['acronym'] ? "{$agency['name']} ({$agency['acronym']})" : $agency['name'];
        $about = trim((string) $agency['description']) ?: "Service guides and General Santos City offices for {$agency['name']}.";
        return [200, "{$name} · " . self::SITE_NAME, $about];
    }
}
