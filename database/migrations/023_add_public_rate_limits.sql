-- 023: Per-hour counters for anonymous public write endpoints.

-- Page views, guide views, and guide feedback each count one hit per visitor and hour.
-- The identifier is a hash, so no raw IP address or visitor ID is stored.
CREATE TABLE IF NOT EXISTS public_rate_limits (
    bucket VARCHAR(40) NOT NULL,
    identifier CHAR(64) NOT NULL,
    window_start DATETIME NOT NULL,
    hits INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket, identifier, window_start),
    KEY idx_public_rate_limits_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
