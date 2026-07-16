import { createClient } from '@supabase/supabase-js';

/**
 * Both values are public by design: the publishable key is meant to ship in the
 * browser bundle, and row-level security (see supabase/schema.sql) is what
 * actually protects each user's data — not secrecy of this key.
 *
 * Env vars take precedence (handy for pointing local dev at another project),
 * but the hardcoded fallbacks mean the deployed build just works with no Vercel
 * configuration required.
 */
const url = import.meta.env.VITE_SUPABASE_URL || 'https://satiltslftjqiktjwehr.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_yZQPUJe2fKVTnUzZGdnz3g_81-Ox5dq';

/** When keys are absent the app runs in local-only mode (no login, no sync). */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
