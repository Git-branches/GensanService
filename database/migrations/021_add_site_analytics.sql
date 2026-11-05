-- Anonymous daily page counts for the admin analytics page.
-- Only the page type, language, and screen size are kept. No IP address, cookie, or visitor ID is stored.

CREATE TABLE IF NOT EXISTS site_daily_views (
    view_date DATE NOT NULL,
    page VARCHAR(20) NOT NULL,
    locale VARCHAR(10) NOT NULL,
    device VARCHAR(10) NOT NULL,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (view_date, page, locale, device),
    KEY idx_site_views_date (view_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
