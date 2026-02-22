export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function loadConfig(): AppConfig {
  const e = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const url = (e as Record<string, string>).VITE_SUPABASE_URL;
  const key = (e as Record<string, string>).VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  return { supabaseUrl: url, supabaseAnonKey: key };
}
