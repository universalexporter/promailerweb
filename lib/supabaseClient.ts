// lib/supabaseClient.ts
//
// ONE browser Supabase client for the whole app, built with @supabase/ssr.
// Crucially, this stores the auth session in COOKIES — the same place the
// server middleware reads from. That shared cookie is what keeps the browser
// and the server in agreement about who is logged in (and stops login loops).
//
// Use this everywhere on the client instead of creating clients with
// createClient() from '@supabase/supabase-js'.

import { createBrowserClient } from '@supabase/ssr'

// A module-level singleton so we never spin up multiple GoTrue instances.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)