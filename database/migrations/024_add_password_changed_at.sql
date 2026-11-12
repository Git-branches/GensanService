-- 024: When the password last changed. A newer timestamp ends every session opened with the old
-- password, so a reset also signs the account out on other devices.
--
-- Safe to run more than once: MySQL 8 has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'admins'
      AND COLUMN_NAME = 'password_changed_at'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE admins ADD COLUMN password_changed_at TIMESTAMP NULL DEFAULT NULL AFTER password_hash',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
