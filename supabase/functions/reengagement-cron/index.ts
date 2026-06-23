// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MESSAGES = [
  { title: '🔥 Sua sequência está em risco!', body: 'Poste hoje para não perder seu streak.' },
  { title: '✨ Sentimos sua falta', body: 'Tem gente nova no Orbikut esperando você.' },
  { title: '💬 Novidades no seu feed', body: 'Veja o que rolou enquanto você estava fora.' },
  { title: '🚀 Bora viralizar?', body: 'Um post seu agora pode bombar. Vai lá!' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Users with active streaks at risk (last_post_date = yesterday, streak > 0)
    const { data: streakRisk } = await admin
      .from('profiles')
      .select('id, current_streak, last_post_date')
      .gt('current_streak', 0)
      .eq('last_post_date', yesterday);

    // Inactive users (last post 3+ days ago, or never)
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const { data: inactive } = await admin
      .from('profiles')
      .select('id, last_post_date')
      .or(`last_post_date.is.null,last_post_date.lt.${threeDaysAgo}`)
      .limit(500);

    const targets = new Map<string, { title: string; body: string }>();

    for (const u of streakRisk ?? []) {
      targets.set(u.id, {
        title: `🔥 Streak de ${u.current_streak} dias em risco!`,
        body: 'Poste agora e mantenha sua sequência viva.',
      });
    }
    for (const u of inactive ?? []) {
      if (!targets.has(u.id)) {
        const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        targets.set(u.id, msg);
      }
    }

    if (!targets.size) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by message
    const grouped = new Map<string, string[]>();
    for (const [uid, msg] of targets) {
      const key = msg.title + '|' + msg.body;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(uid);
    }

    let totalSent = 0;
    for (const [key, ids] of grouped) {
      const [title, body] = key.split('|');
      const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': 'f0a948fd02f4bc88efc93757c4b128a6476d63b67ee1c91f55d2bae2b023423d',
        },
        body: JSON.stringify({ user_ids: ids, title, body, url: '/' }),
      });
      const data = await resp.json();
      totalSent += data?.sent ?? 0;
    }

    return new Response(JSON.stringify({ sent: totalSent, targets: targets.size }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('reengagement-cron error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
