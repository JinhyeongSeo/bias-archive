import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/index'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// For backward compatibility - creates a new client instance
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
