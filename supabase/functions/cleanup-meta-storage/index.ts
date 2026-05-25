// Borra del bucket `meta-publications` los archivos de publicaciones que ya
// fueron publicadas (publish_status = 'published') hace más de N días.
// Reduce egress + storage sin afectar publicaciones activas o pendientes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_DAYS_OLD = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let daysOld = DEFAULT_DAYS_OLD;
    let dryRun = false;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.days_old === "number" && body.days_old > 0) daysOld = body.days_old;
      if (body?.dry_run === true) dryRun = true;
    } catch { /* sin body, ok */ }

    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    // 1) publicaciones publicadas hace más de N días
    const { data: pubs, error: pubErr } = await admin
      .from("publications")
      .select("id, publish_completed_at, updated_at")
      .eq("publish_status", "published")
      .lt("updated_at", cutoff);

    if (pubErr) throw new Error(`query publications: ${pubErr.message}`);

    const candidateIds = (pubs ?? []).map((p) => String(p.id));
    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ success: true, deleted: 0, scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalDeleted = 0;
    let totalScanned = 0;

    // 2) por cada publicación, listar archivos en su carpeta y borrarlos
    for (const pubId of candidateIds) {
      const { data: files, error: lsErr } = await admin
        .storage.from("meta-publications")
        .list(pubId, { limit: 100 });

      if (lsErr) {
        console.warn(`[cleanup] list ${pubId} failed:`, lsErr.message);
        continue;
      }
      if (!files || files.length === 0) continue;

      totalScanned += files.length;
      const paths = files.map((f) => `${pubId}/${f.name}`);

      if (dryRun) {
        console.log(`[cleanup] (dry) would delete ${paths.length} files from ${pubId}`);
        totalDeleted += paths.length;
        continue;
      }

      const { error: rmErr } = await admin.storage.from("meta-publications").remove(paths);
      if (rmErr) {
        console.warn(`[cleanup] remove ${pubId} failed:`, rmErr.message);
        continue;
      }
      totalDeleted += paths.length;
      console.log(`[cleanup] deleted ${paths.length} files from ${pubId}`);
    }

    return new Response(
      JSON.stringify({ success: true, dry_run: dryRun, publications: candidateIds.length, scanned: totalScanned, deleted: totalDeleted, cutoff }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[cleanup-meta-storage] fatal", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
