# Database

MySQL 8+ / MariaDB 10.4+ schema for Andam GenSan.

## Structure

- `schema.sql` — full schema in one file (useful for quickly recreating the database).
- `migrations/` — the same schema split into ordered, individually runnable files.
- `seeders/` — starter data (categories, agencies, a default local admin account, one sample published service).

## Setup (XAMPP / MariaDB)

1. Start MySQL from the XAMPP Control Panel.
2. Create the database and apply the schema:

   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS gensan_service_navigator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   C:\xampp\mysql\bin\mysql.exe -u root gensan_service_navigator < database/schema.sql
   ```

3. (Optional) Load starter data:

   ```bash
   for f in database/seeders/*.sql; do
     C:\xampp\mysql\bin\mysql.exe -u root gensan_service_navigator < "$f"
   done
   ```

Adjust `-u root` and add `-p` if your local MySQL/MariaDB root account has a password.

## Default local admin account

Created by `seeders/003_seed_admin.sql`:

- Email: `admin@gensan-service-navigator.local`
- Password: `ChangeMe123!`

This account is for local development only. Change the password or remove the seeder before any shared or production use.

## Notes

- All tables use `InnoDB` with `utf8mb4` for full Unicode support.
- Foreign keys cascade on delete for child/detail tables (requirements, steps, eligibility, sources) so deleting a service cleans up its related rows.
- `services.status` (`draft` / `published` / `archived`) controls what the public frontend should display — only `published` services should be exposed by public API endpoints.
- A `FULLTEXT` index on `services(title, summary, description)` supports the search feature described in the system requirements.
