---
created: 2026-01-14T17:45
title: Fix database loading issue for links and groups
area: database
files:
  - src/lib/links.ts
  - src/lib/biases.ts
  - src/lib/tags.ts
  - src/app/api/links/route.ts
---

## Problem

Authenticated users cannot load their saved links and group data from the database. This is because server-side API routes are using an anonymous Supabase client that doesn't include the user's session cookies, causing RLS (Row Level Security) to filter out their data.

Also, some tables like `link_tags` and `link_media` are missing `user_id` on insertion.

## Solution

1. Refactor lib functions to accept an optional Supabase client.
2. Use `createClient()` from `supabase-server.ts` in Route Handlers.
3. Pass the server client to lib functions.
4. Ensure `user_id` is set for all related row insertions.
