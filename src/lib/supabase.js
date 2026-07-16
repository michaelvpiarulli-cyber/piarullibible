import { createClient } from '@supabase/supabase-js';

/**
 * Both values are public by design: the anon key is meant to ship in the
 * browser bundle, and row-level security (see supabase/schema.sql) is what
 * actually protects each user's data. They come from Vite env vars so the same
 * build works locally and on Vercel.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** When keys are absent the app runs in local-only mode (no login, no sync). */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
