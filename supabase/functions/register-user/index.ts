import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
const ALLOWED_STATES = ['AL', 'KY', 'MA', 'MN', 'NJ', 'NV', 'OR', 'SC', 'TX', 'WA'];
const EDUCATION_LEVELS = ['high_school', 'associate', 'bachelor', 'graduate'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^\+?923\d{9}$/;

function sanitize(s: unknown): string {
  if (s === null || s === undefined) return '';
  return String(s).trim().replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as { step1?: { educationLevel?: string; hasInternetAccess?: boolean; hasCertifications?: boolean }; step2?: Record<string, unknown> };
    const step1 = body.step1;
    const step2 = body.step2;
    if (!step1 || !step2) {
      return new Response(JSON.stringify({ error: 'Missing step1 or step2' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!EDUCATION_LEVELS.includes(step1.educationLevel ?? '')) {
      return new Response(JSON.stringify({ error: 'Invalid education level' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (typeof step1.hasInternetAccess !== 'boolean' || typeof step1.hasCertifications !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid step1 booleans' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const firstName = sanitize(step2.firstName);
    const lastName = sanitize(step2.lastName);
    const email = sanitize(step2.email);
    const phone = sanitize(step2.phone);
    const address = sanitize(step2.address);
    const city = sanitize(step2.city);
    const stateCode = sanitize(step2.state);
    if (!firstName || !lastName || !address || !city) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid phone. Use format +92 330 4014980' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!ALLOWED_STATES.includes(stateCode)) {
      return new Response(JSON.stringify({ error: 'Invalid state' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (step2.agreement !== true) {
      return new Response(JSON.stringify({ error: 'Agreement required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: stateRow } = await supabase.from('states').select('id').eq('code', stateCode).single();
    if (!stateRow?.id) {
      return new Response(JSON.stringify({ error: 'State not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: user, error } = await supabase.from('users').insert({
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      address,
      city,
      state_id: stateRow.id,
      education_level: step1.educationLevel,
      internet_access: step1.hasInternetAccess,
      certifications: step1.hasCertifications,
      agreement: true,
    }).select('id').single();
    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ userId: user.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
