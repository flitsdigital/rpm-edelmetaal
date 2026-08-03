/// <reference types="astro/client" />
import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      /** Gezet door de middleware op afgeschermde routes. */
      supabase?: SupabaseClient;
      gebruiker?: User;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly N8N_TAXATIE_WEBHOOK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
