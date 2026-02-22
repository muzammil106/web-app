import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
const ALLOWED_STATES = ['AL', 'KY', 'MA', 'MN', 'NJ', 'NV', 'OR', 'SC', 'TX', 'WA'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const body = req.method === 'POST' ? await req.json() : {};
    const stateCode = String(body.stateCode ?? '').trim().toUpperCase();
    if (!stateCode || !ALLOWED_STATES.includes(stateCode)) {
      return new Response(JSON.stringify({ error: 'Valid stateCode required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: stateRow } = await supabase.from('states').select('id').eq('code', stateCode).single();
    if (!stateRow?.id) {
      return new Response(JSON.stringify({ offers: [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: offersRows } = await supabase.from('offers').select('id, name, description, image_url, state_id').or('state_id.is.null,state_id.eq.' + stateRow.id);
    const offers = (offersRows ?? []).map((o) => ({ id: o.id, name: o.name, description: o.description, imageUrl: o.image_url, stateCode: o.state_id ? stateCode : null }));
    return new Response(JSON.stringify({ offers }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
