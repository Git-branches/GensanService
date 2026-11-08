<?php

namespace App\Controllers;

use App\Database;
use App\Request;
use App\Response;
use App\Services\PublicRateLimit;

class AnalyticsController
{
    public const PAGES = ['home', 'services', 'guide', 'life_event', 'agencies', 'agency', 'offices', 'faq', 'privacy', 'not_found'];
    public const LOCALES = ['en', 'ceb', 'fil', 'hil', 'blaan', 'mdh', 'mrw'];
    public const DEVICES = ['phone', 'tablet', 'desktop'];

    // Crawlers, link previews, and test browsers are not people reading the site.
    public const BOTS ='/bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|python|curl|wget/i';

    /**
     * Adds one to today's count for a page type, language, and screen size.
     * No IP address, cookie, or visitor identifier is stored.
     */
    public function record(): void
    {
        $body = Request::json();
        $page = (string) ($body['page'] ?? '');
        $locale = (string) ($body['locale'] ?? '');
        $device = (string) ($body['device'] ?? '');

        if (!in_array($page, self::PAGES, true) || !in_array($locale, self::LOCALES, true) || !in_array($device, self::DEVICES, true)) {
            Response::error('Unknown page, language, or device.', 422);
        }

        if (preg_match(self::BOTS, (string) Request::header('User-Agent'))) {
            Response::success(['recorded' => false]);
        }

        if (PublicRateLimit::exceeded('page_view', PublicRateLimit::key(Request::ip()), 120)) {
            Response::success(['recorded' => false]);
        }

        Database::connection()->prepare(
            'INSERT INTO site_daily_views (view_date, page, locale, device, views) VALUES (CURDATE(), :page, :locale, :device, 1)
             ON DUPLICATE KEY UPDATE views = views + 1'
        )->execute(['page' => $page, 'locale' => $locale, 'device' => $device]);

        Response::success(['recorded' => true]);
    }
}
