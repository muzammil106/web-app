import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = req.method === 'POST' ? await req.json() : {};
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, address, city, state_id, education_level, internet_access, certifications')
      .eq('id', userId)
      .single();

    if (userError || !userRow) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: stateRow } = await supabase.from('states').select('code').eq('id', (userRow as { state_id?: string }).state_id).single();
    const stateCode = stateRow?.code ?? '';

    const { data: userOffers } = await supabase.from('user_offers').select('offer_id').eq('user_id', userId);
    const offerIds = (userOffers ?? []).map((r) => r.offer_id);
    let offers: { id: string; name: string; description: string; imageUrl: string | null; stateCode: string | null }[] = [];
    if (offerIds.length > 0) {
      const { data: offerRows } = await supabase.from('offers').select('id, name, description, image_url, state_id').in('id', offerIds);
      const stateIds = [...new Set((offerRows ?? []).map((o) => o.state_id).filter(Boolean))];
      let stateCodes: Record<string, string> = {};
      if (stateIds.length > 0) {
        const { data: states } = await supabase.from('states').select('id, code').in('id', stateIds);
        stateCodes = Object.fromEntries((states ?? []).map((s) => [s.id, s.code]));
      }
      offers = (offerRows ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        imageUrl: o.image_url,
        stateCode: o.state_id ? stateCodes[o.state_id] ?? null : null,
      }));
    }

    const user = {
      id: userRow.id,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      email: userRow.email,
      phone: userRow.phone,
      address: userRow.address,
      city: userRow.city,
      stateCode,
      educationLevel: userRow.education_level,
      hasInternetAccess: userRow.internet_access,
      hasCertifications: userRow.certifications,
    };

    return new Response(
      JSON.stringify({ user, offers }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
