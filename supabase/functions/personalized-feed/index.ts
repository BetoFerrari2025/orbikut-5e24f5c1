import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Create admin client for reading engagement data
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Create user client to get the user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 1. Get user's recent engagement signals (last 30 days)
    const { data: signals } = await supabaseAdmin
      .from("engagement_signals")
      .select("post_id, signal_type, dwell_seconds")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    // 2. Get engaged post details to extract content patterns
    const engagedPostIds = [...new Set((signals || []).map((s) => s.post_id))];

    let engagedPosts: any[] = [];
    if (engagedPostIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("posts")
        .select("id, caption, user_id")
        .in("id", engagedPostIds.slice(0, 50));
      engagedPosts = data || [];
    }

    // 3. Get user's follows
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followedIds = (follows || []).map((f) => f.following_id);

    // 3b. Get admin user IDs to boost their posts
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (adminRoles || []).map((r) => r.user_id);

    // 4. Build engagement score per post
    const postScores: Record<string, number> = {};
    for (const signal of signals || []) {
      const pid = signal.post_id;
      if (!postScores[pid]) postScores[pid] = 0;
      switch (signal.signal_type) {
        case "dwell":
          postScores[pid] += Math.min(Number(signal.dwell_seconds) * 0.5, 10);
          break;
        case "like":
          postScores[pid] += 5;
          break;
        case "comment":
          postScores[pid] += 8;
          break;
        case "save":
          postScores[pid] += 10;
          break;
        case "share":
          postScores[pid] += 7;
          break;
      }
    }

    // 5. Extract keywords from engaged post captions
    const engagedCaptions = engagedPosts
      .filter((p) => p.caption)
      .map((p) => p.caption)
      .join(" ");

    // 6. Get authors the user engages with most
    const authorEngagement: Record<string, number> = {};
    for (const post of engagedPosts) {
      const score = postScores[post.id] || 1;
      if (!authorEngagement[post.user_id]) authorEngagement[post.user_id] = 0;
      authorEngagement[post.user_id] += score;
    }

    // 7. Use AI to extract interest topics from engaged captions
    let interestTopics: string[] = [];
    if (engagedCaptions.length > 20) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content:
                  "You extract interest topics from social media post captions. Return ONLY a JSON array of 5-15 topic keywords in Portuguese. Example: [\"viagem\",\"praia\",\"fotografia\",\"comida\",\"música\"]. No explanation, just the JSON array.",
              },
              {
                role: "user",
                content: `Extract the main interest topics from these post captions the user engaged with:\n\n${engagedCaptions.slice(0, 2000)}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content?.trim() || "[]";
          try {
            const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, ""));
            if (Array.isArray(parsed)) interestTopics = parsed;
          } catch {
            // Try to extract array from response
            const match = content.match(/\[.*\]/s);
            if (match) {
              try { interestTopics = JSON.parse(match[0]); } catch {}
            }
          }
        }
      } catch (e) {
        console.error("AI topic extraction failed:", e);
      }
    }

    // 8. Fetch all recent posts
    const { data: allPosts } = await supabaseAdmin
      .from("posts")
      .select("id, caption, user_id, created_at, image_url")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!allPosts || allPosts.length === 0) {
      return new Response(JSON.stringify({ post_ids: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9. Score each post for personalization
    const rankedPosts = allPosts.map((post) => {
      let score = 0;

      // Recency boost (newer = higher, max 15 points)
      const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 15 - hoursAgo * 0.1);

      // Following boost
      if (followedIds.includes(post.user_id)) score += 10;

      // Author engagement boost
      if (authorEngagement[post.user_id]) {
        score += Math.min(authorEngagement[post.user_id] * 0.5, 15);
      }

      // Topic relevance boost
      if (post.caption && interestTopics.length > 0) {
        const captionLower = post.caption.toLowerCase();
        for (const topic of interestTopics) {
          if (captionLower.includes(topic.toLowerCase())) {
            score += 3;
          }
        }
      }

      // Penalize own posts slightly (user already knows them)
      if (post.user_id === userId) score -= 5;

      // Already heavily engaged = slightly lower (variety)
      if (postScores[post.id] && postScores[post.id] > 10) score -= 2;

      return { id: post.id, score };
    });

    // Sort by score descending
    rankedPosts.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({ post_ids: rankedPosts.map((p) => p.id), topics: interestTopics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("personalized-feed error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
