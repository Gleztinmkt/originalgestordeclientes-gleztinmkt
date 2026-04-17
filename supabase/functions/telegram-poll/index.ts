import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY_1");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const TELEGRAM_API_KEY_INTERNAL = Deno.env.get("TELEGRAM_API_KEY");

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TELEGRAM_API_KEY_INTERNAL) {
    console.error("Missing required env vars");
    return new Response(JSON.stringify({ error: "Missing env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: state, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    console.error("State error:", stateErr);
    return new Response(JSON.stringify({ error: stateErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let currentOffset: number = state.update_offset;
  let totalProcessed = 0;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    let response: Response;
    try {
      response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ["message", "callback_query"],
        }),
      });
    } catch (e) {
      console.error("Fetch failed:", e);
      break;
    }

    const data = await response.json();
    if (!response.ok) {
      console.error("getUpdates error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Forward each update to telegram-assistant
    for (const update of updates) {
      try {
        const assistantRes = await fetch(`${SUPABASE_URL}/functions/v1/telegram-assistant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": TELEGRAM_API_KEY_INTERNAL,
          },
          body: JSON.stringify({ update, format: "telegram" }),
        });

        if (!assistantRes.ok) {
          const errText = await assistantRes.text();
          console.error(`telegram-assistant failed for update ${update.update_id}:`, errText);
        } else {
          const result = await assistantRes.json().catch(() => null);
          // Send replies back to Telegram
          if (result?.mensajes && Array.isArray(result.mensajes)) {
            const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
            if (chatId) {
              for (let i = 0; i < result.mensajes.length; i++) {
                const msg = result.mensajes[i];
                const isLast = i === result.mensajes.length - 1;
                const payload: Record<string, unknown> = {
                  chat_id: chatId,
                  text: typeof msg === "string" ? msg : msg.text,
                  parse_mode: "HTML",
                };
                if (isLast && result.reply_markup) {
                  payload.reply_markup = result.reply_markup;
                }
                if (typeof msg === "object" && msg.reply_markup) {
                  payload.reply_markup = msg.reply_markup;
                }

                await fetch(`${GATEWAY_URL}/sendMessage`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                    "X-Connection-Api-Key": TELEGRAM_API_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                }).catch((e) => console.error("sendMessage failed:", e));
              }
            }
          }

          // Acknowledge callback queries
          if (update.callback_query) {
            await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": TELEGRAM_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ callback_query_id: update.callback_query.id }),
            }).catch((e) => console.error("answerCallbackQuery failed:", e));
          }
        }
      } catch (e) {
        console.error(`Error processing update ${update.update_id}:`, e);
      }
    }

    totalProcessed += updates.length;
    const newOffset = Math.max(...updates.map((u: { update_id: number }) => u.update_id)) + 1;

    const { error: offsetErr } = await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (offsetErr) {
      console.error("Offset update error:", offsetErr);
      return new Response(JSON.stringify({ error: offsetErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    currentOffset = newOffset;
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
