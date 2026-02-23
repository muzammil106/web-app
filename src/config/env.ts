export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function loadConfig(): AppConfig {
  const e = import.meta.env as Record<string, string | undefined>;
  const url = e.VITE_SUPABASE_URL;
  const key = e.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  return { supabaseUrl: url, supabaseAnonKey: key };
}
