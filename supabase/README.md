# Supabase setup

The Next.js app expects these tables in Postgres. They are **not** created automatically — you must run the SQL once.

## Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Copy the full contents of [`schema.sql`](./schema.sql) and click **Run**.
4. Open **Table Editor** — you should see `profiles`, `sermons`, `speakers`, etc.
5. Promote your user to admin (replace email):

```sql
update public.profiles
set role = 'ADMIN'
where id = (select id from auth.users where email = 'your-email@example.com');
```

6. In **Authentication → URL Configuration**, set Site URL to `http://localhost:3000` and add redirect: `http://localhost:3000/auth/callback`.

## Profiles

- `profiles.id` = same UUID as **Authentication → Users**.
- New sign-ups get a `profiles` row automatically (trigger in `schema.sql`).
- Roles: `MEMBER` (default), `LEADER`, `ADMIN` — only `ADMIN` and `LEADER` can open `/admin`.
