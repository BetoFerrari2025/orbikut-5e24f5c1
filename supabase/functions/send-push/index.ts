// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC = 'BP_NfMnOgKj6VOXqKUJ7bFmJtauxFeAaZEHur4vGrRSWK69US8I7kQJ9RgaOKEd2a251gtMiJV4KutKb9qTuCiI';
const VAPID_PRIVATE = 'hebga5N4zjgu-8sLkqfnZ6X6Bkwr-xcHMFQBu3cZN9M';
const VAPID_SUBJECT = 'mailto:joseadalbertoferrari@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface Payload {
  user_ids: string[];
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
}

const INTERNAL_TOKEN = 'f0a948fd02f4bc88efc93757c4b128a6476d63b67ee1c91f55d2bae2b023423d';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Internal-only: require shared token (DB triggers + cron + admin function)
  if (req.headers.get('X-Internal-Token') !== INTERNAL_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const p = (await req.json()) as Payload;
    if (!p.user_ids?.length || !p.title || !p.body) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id,endpoint,p256dh,auth')
      .in('user_id', p.user_ids);

    if (error) throw error;

    const payload = JSON.stringify({
      title: p.title,
      body: p.body,
      url: p.url || '/',
      icon: p.icon || '/icon-192.png',
      image: p.image,
      tag: p.tag,
    });

    const results = await Promise.allSettled(
      (subs ?? []).map(async (s: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          return { id: s.id, ok: true };
        } catch (e: any) {
          // Remove dead subscriptions (410 Gone / 404)
          if (e?.statusCode === 410 || e?.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id);
          }
          return { id: s.id, ok: false, status: e?.statusCode, msg: String(e?.message ?? e) };
        }
      }),
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && (r as any).value.ok).length;
    return new Response(
      JSON.stringify({ sent, total: subs?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('send-push error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
