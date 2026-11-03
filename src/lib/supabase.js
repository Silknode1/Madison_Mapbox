import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Shared secret that scopes starred places to your two phones (see supabase/migrations). */
export const TRIP_CODE = (import.meta.env.VITE_TRIP_CODE || '').trim();

export const supabaseEnabled = Boolean(url && key && !url.includes('YOUR_'));

/** null when Supabase isn't configured — callers fall back to src/data.js + localStorage. */
export const supabase = supabaseEnabled
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Row-level security compares this header to shared_pins.trip_code.
      global: { headers: { 'x-trip-code': TRIP_CODE } },
    })
  : null;
