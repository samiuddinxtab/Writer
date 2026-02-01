# Database

D1 SQL migrations. Each .sql file is applied in order.

## Structure

- `/migrations` — SQL migration files, numbered sequentially (001_init.sql, 002_*, etc.)

## Applying Migrations

Migrations are applied using wrangler:

```bash
# Local development
npx wrangler d1 execute DB --local --file=./database/migrations/001_init.sql

# Production
npx wrangler d1 execute DB --file=./database/migrations/001_init.sql
```

## Naming Convention

Files should be named with a three-digit prefix and descriptive name:
- `001_init.sql`
- `002_add_users.sql`
- `003_add_articles.sql`
