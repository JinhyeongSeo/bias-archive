---
phase: 20-authentication
plan: 01
status: complete
started: 2026-01-14
completed: 2026-01-14
commits: [9c36f11, 426da05]
---

# Plan 20-01: Auth Infrastructure - Summary

## Objective
Supabase Auth 기반 인증 인프라 구축: DB 스키마에 user_id 추가, RLS 정책 설정, @supabase/ssr 기반 서버/클라이언트 구성

## Tasks Completed

### Task 1: DB 스키마 확장 - user_id 및 RLS 정책
- **Commit:** `9c36f11`
- **Files:** `supabase/migrations/20260114000005_user_auth.sql`
- **Changes:**
  - Added `user_id` UUID column to all 6 tables (biases, groups, links, tags, link_tags, link_media)
  - Columns reference `auth.users(id)` with `ON DELETE SET NULL`
  - Created indexes on all `user_id` columns for query performance
  - Enabled Row Level Security (RLS) on all tables
  - Created 4 policies per table:
    - SELECT: `auth.uid() = user_id OR user_id IS NULL` (allows reading own data and public data)
    - INSERT: `auth.uid() IS NOT NULL` (only authenticated users)
    - UPDATE: `auth.uid() = user_id` (only owner)
    - DELETE: `auth.uid() = user_id` (only owner)

### Task 2: @supabase/ssr 설치 및 클라이언트 설정
- **Commit:** `426da05`
- **Files:**
  - `package.json` - Added @supabase/ssr dependency
  - `src/lib/supabase.ts` - Updated to use `createBrowserClient` from @supabase/ssr
  - `src/lib/supabase-server.ts` - New file for Server Components and Route Handlers
  - `src/lib/supabase-middleware.ts` - New file for middleware session refresh
  - `src/types/database.ts` - Added `user_id` field to all table types (Row, Insert, Update)

## Verification Results
- [x] `npx supabase db push` - Migration applied successfully
- [x] `npm run build` - Build completed without errors
- [x] `src/lib/supabase*.ts` files export correctly
- [x] Database types include `user_id` field in all tables

## Files Modified
| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/20260114000005_user_auth.sql` | Created | user_id columns, indexes, RLS policies |
| `package.json` | Modified | Added @supabase/ssr dependency |
| `src/lib/supabase.ts` | Modified | Use createBrowserClient from @supabase/ssr |
| `src/lib/supabase-server.ts` | Created | Server client with cookies() |
| `src/lib/supabase-middleware.ts` | Created | Middleware client with session refresh |
| `src/types/database.ts` | Modified | Added user_id to all table types |

## Deviations
None. All tasks completed as specified in the plan.

## Notes
- user_id columns are nullable to maintain backward compatibility with existing data
- Existing data (user_id IS NULL) remains accessible via SELECT policy
- New data requires authentication for INSERT, and only owners can UPDATE/DELETE
- The browser client maintains backward compatibility with `export const supabase` for existing code
