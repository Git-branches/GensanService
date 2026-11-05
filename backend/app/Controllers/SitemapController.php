<?php

namespace App\Controllers;

use App\Database;

/** sitemap.xml and robots.txt, served at the site root by frontend/public/.htaccess. */
class SitemapController
{
    private const STATIC_ROUTES = ['/', '/services', '/agencies', '/offices', '/faq', '/privacy'];

    public function sitemap(): void
    {
        $pdo = Database::connection();
        $origin = ShareController::origin();
        $urls = array_map(fn ($path) => ['loc' => $origin . $path, 'lastmod' => null], self::STATIC_ROUTES);

        $guides = $pdo->query("SELECT slug, updated_at FROM services WHERE status = 'published' ORDER BY title");
        foreach ($guides as $guide) {
            $urls[] = ['loc' => "{$origin}/services/{$guide['slug']}", 'lastmod' => substr((string) $guide['updated_at'], 0, 10)];
        }
        $agencies = $pdo->query('SELECT slug, updated_at FROM agencies WHERE is_active = 1 ORDER BY name');
        foreach ($agencies as $agency) {
            $urls[] = ['loc' => "{$origin}/agencies/{$agency['slug']}", 'lastmod' => substr((string) $agency['updated_at'], 0, 10)];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $url) {
            $xml .= '  <url><loc>' . htmlspecialchars($url['loc'], ENT_XML1, 'UTF-8') . '</loc>'
                . ($url['lastmod'] ? '<lastmod>' . $url['lastmod'] . '</lastmod>' : '') . "</url>\n";
        }
        $xml .= "</urlset>\n";

        header('Content-Type: application/xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        echo $xml;
        exit;
    }

    public function robots(): void
    {
        header('Content-Type: text/plain; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: " . ShareController::origin() . "/sitemap.xml\n";
        exit;
    }
}
