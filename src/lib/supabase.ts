import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'PUBLIC_SUPABASE_URL of PUBLIC_SUPABASE_ANON_KEY ontbreekt. ' +
      'Zie .env.example — zonder deze twee kan de site geen prijzen ophalen.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
