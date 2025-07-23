# Database Schema Documentation

This document provides a comprehensive overview of the current Supabase database schema, including all tables, columns, types, relationships, and relevant metadata. This is intended as a reference for future development and maintenance.

---

## Table: `ETSINF`

- **Purpose:** Stores exam information for the ETSINF school.
- **Row Level Security (RLS):** Enabled
- **Estimated Rows:** 1003
- **Size:** 1264 kB

### Columns
| Name               | Type                      | Nullable | Default Value                                      | Description         |
|--------------------|---------------------------|----------|---------------------------------------------------|---------------------|
| `exam_instance_id` | `bigint`                  | No       | `nextval('etsinf_exam_instance_id_seq'::regclass)` | Primary key         |
| `exam_date`        | `date`                    | No       |                                                   | Exam date           |
| `exam_time`        | `time without time zone`  | No       |                                                   | Exam start time     |
| `duration_minutes` | `integer`                 | No       |                                                   | Duration in minutes |
| `code`             | `integer`                 | No       |                                                   | Exam code           |
| `subject`          | `text`                    | No       |                                                   | Subject name        |
| `acronym`          | `character varying`       | No       |                                                   | Subject acronym     |
| `degree`           | `text`                    | No       |                                                   | Degree name         |
| `year`             | `smallint`                | No       |                                                   | Academic year       |
| `semester`         | `character`               | No       |                                                   | Semester            |
| `place`            | `text`                    | Yes      |                                                   | Exam location       |
| `comment`          | `text`                    | Yes      |                                                   | Additional comments |
| `school`           | `text`                    | No       | `'ETSINF'::text`                                  | School identifier   |

#### Primary Key
- `exam_instance_id`

#### Notes
- All fields except `place` and `comment` are required.
- The `school` field is always set to `'ETSINF'` for this table.

---

## Table: `user_calendars`

- **Purpose:** Stores user-created calendar configurations and filters.
- **Row Level Security (RLS):** Enabled
- **Estimated Rows:** 1 (plus 2 dead rows)
- **Size:** 32 kB

### Columns
| Name        | Type                      | Nullable | Default Value      | Description                        |
|-------------|---------------------------|----------|--------------------|------------------------------------|
| `id`        | `uuid`                    | No       | `gen_random_uuid()`| Primary key                        |
| `user_id`   | `uuid`                    | No       |                    | References `auth.users(id)`        |
| `name`      | `text`                    | No       |                    | Calendar name                      |
| `filters`   | `jsonb`                   | No       |                    | Filter configuration (JSON object) |
| `created_at`| `timestamp with time zone`| Yes      | `now()`            | Creation timestamp                 |

#### Primary Key
- `id`

#### Relationships
- `user_id` references `auth.users(id)` (foreign key)

#### Notes
- The `filters` column stores JSON data for user-specific calendar filters.
- `created_at` is set automatically if not provided.

---

## Table: `user_google_tokens`

- **Purpose:** Stores OAuth tokens for users' Google accounts (for calendar sync, etc.).
- **Row Level Security (RLS):** Enabled
- **Estimated Rows:** 0
- **Size:** 32 kB

### Columns
| Name         | Type                      | Nullable | Default Value      | Description                        |
|--------------|---------------------------|----------|--------------------|------------------------------------|
| `id`         | `uuid`                    | No       | `gen_random_uuid()`| Primary key                        |
| `user_id`    | `uuid`                    | No       |                    | References `auth.users(id)`        |
| `access_token`| `text`                   | No       |                    | Google access token                 |
| `refresh_token`| `text`                  | Yes      |                    | Google refresh token                |
| `expires_at` | `bigint`                  | No       |                    | Expiry timestamp (epoch seconds)    |
| `scope`      | `text`                    | Yes      |                    | OAuth scopes                        |
| `token_type` | `text`                    | Yes      | `'Bearer'::text`   | Token type (usually 'Bearer')       |
| `created_at` | `timestamp with time zone`| Yes      | `now()`            | Creation timestamp                  |
| `updated_at` | `timestamp with time zone`| Yes      | `now()`            | Last update timestamp               |

#### Primary Key
- `id`

#### Relationships
- `user_id` references `auth.users(id)` (foreign key, unique)

#### Notes
- Each user can have only one set of Google tokens (enforced by unique `user_id`).
- `created_at` and `updated_at` are set automatically if not provided.

---

## General Best Practices
- **RLS:** All tables have Row Level Security enabled. Always ensure policies are in place for secure access.
- **UUIDs:** Use UUIDs for user and token identification for security and uniqueness.
- **Timestamps:** Use `timestamp with time zone` for all date/time fields to avoid timezone issues.
- **JSONB:** Use `jsonb` for flexible, structured data (e.g., filters).
- **Foreign Keys:** Always reference the `auth.users` table for user-related data.
- **Token Storage:** Store OAuth tokens securely and never expose them to the client.

---

## Future Considerations
- Document any new tables or columns here as the schema evolves.
- Add comments to columns in the database for automatic documentation.
- Review RLS policies regularly for security.
- Consider adding indexes for performance if row counts increase.

---

## Database Extensions

The following PostgreSQL extensions are available in this Supabase project. Extensions add powerful features to your database, such as new data types, indexing methods, and utility functions.

| Name                        | Installed Version | Default Version | Description                                                        |
|-----------------------------|------------------|-----------------|--------------------------------------------------------------------|
| hypopg                     | 1.4.1            | 1.4.1           | Hypothetical indexes for PostgreSQL                                |
| supabase_vault              | 0.3.1            | 0.3.1           | Supabase Vault Extension                                           |
| pg_graphql                  | 1.5.11           | 1.5.11          | GraphQL support for PostgreSQL                                     |
| uuid-ossp                   | 1.1              | 1.1             | Generate universally unique identifiers (UUIDs)                    |
| pgjwt                       | 0.2.0            | 0.2.0           | JSON Web Token API for PostgreSQL                                  |
| pg_stat_statements          | 1.10             | 1.10            | Track planning and execution statistics of all SQL statements      |
| pgcrypto                    | 1.3              | 1.3             | Cryptographic functions                                            |
| index_advisor               | 0.2.0            | 0.2.0           | Query index advisor                                                |
| ...                         | ...              | ...             | (Many more available, see Supabase dashboard for full list)        |

**Note:** Only a subset of all available extensions are installed by default. Some are enabled for advanced use cases (e.g., PostGIS for spatial data, TimescaleDB for time-series, etc.).

---

## Database Migrations

_No migrations are currently listed in the project. Migrations are used to track schema changes over time. If you use Supabase migrations, they will appear here for reference._

---

## Edge Functions

_No Edge Functions are currently deployed in this project. Edge Functions allow you to run serverless code close to your users, integrated with your database and authentication._

---

## Security Advisor Findings

Supabase provides automated security checks for your database. Below are the current findings:

- **Function Search Path Mutable (WARN):**
  - Functions `public.update_updated_at_column`, `public.store_google_tokens`, `public.get_google_tokens`, and `public.delete_google_tokens` have a mutable `search_path`. This can be a security risk. [Remediation Guide](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- **Leaked Password Protection Disabled (WARN):**
  - Leaked password protection is currently disabled. Enable this feature to prevent users from using compromised passwords. [Remediation Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## Performance Advisor Findings

Supabase also checks for performance issues. Below are the current findings:

- **Unindexed Foreign Keys (INFO):**
  - Table `public.user_calendars` has a foreign key `user_calendars_user_id_fkey` without a covering index. This can impact performance. [Remediation Guide](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- **RLS Policy Performance (WARN):**
  - Several RLS policies on `user_calendars` and `user_google_tokens` re-evaluate `current_setting()` or `auth.<function>()` for each row, which can be slow at scale. Use `(select auth.<function>())` instead. [Remediation Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- **Unused Indexes (INFO):**
  - Several indexes on `ETSINF` and `user_google_tokens` have not been used. Consider removing them if not needed. [Remediation Guide](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
- **Duplicate Index (WARN):**
  - Table `ETSINF` has duplicate indexes: `idx_etsinf_date` and `idx_etsinf_exam_date`. Remove duplicates to optimize performance. [Remediation Guide](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index)

---

## Recommendations

- **Review and address security warnings** to ensure your database is protected against common vulnerabilities.
- **Optimize performance** by indexing foreign keys, removing unused or duplicate indexes, and improving RLS policy efficiency.
- **Enable and use extensions** as needed for your application (e.g., `pg_graphql` for GraphQL APIs, `pgcrypto` for encryption, etc.).
- **Document and track migrations** to maintain a clear history of schema changes.
- **Consider using Edge Functions** for custom backend logic close to your data.

---

_Last updated: [auto-generated]_
