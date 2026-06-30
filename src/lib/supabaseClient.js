import { createClient } from "@supabase/supabase-js";

const supabaseUrl = typeof import.meta.env.VITE_SUPABASE_URL === "string"
  ? import.meta.env.VITE_SUPABASE_URL.trim()
  : "";
const supabaseKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === "string"
  ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  : "";

function isRealSupabaseUrl(value) {
  if (!value || value.includes("your-project-ref")) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isRealSupabaseKey(value) {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return !lowered.startsWith("your-") && !lowered.includes("placeholder");
}

export const isSupabaseConfigured = isRealSupabaseUrl(supabaseUrl) && isRealSupabaseKey(supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export const STORAGE_BUCKET = "design-assets";
