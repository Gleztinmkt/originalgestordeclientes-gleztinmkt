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
    let includeOrphans = true;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.days_old === "number" && body.days_old >= 0) daysOld = body.days_old;
      if (body?.dry_run === true) dryRun = true;
      if (body?.include_orphans === false) includeOrphans = false;
    } catch { /* sin body, ok */ }

    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    // 1) publicaciones publicadas hace más de N días (o todas si days_old=0)
    let query = admin
      .from("publications")
      .select("id, published_at, created_at")
      .eq("publish_status", "published");
    if (daysOld > 0) query = query.lt("created_at", cutoff);
    const { data: pubs, error: pubErr } = await query;

    if (pubErr) throw new Error(`query publications: ${pubErr.message}`);

    const publishedIds = new Set((pubs ?? []).map((p) => String(p.id)));
    const candidateIds = new Set(publishedIds);

    // 2) huérfanos: carpetas en el bucket cuyo publication_id ya no existe en la tabla
    if (includeOrphans) {
      const { data: rootFolders } = await admin.storage.from("meta-publications").list("", { limit: 1000 });
      const folderIds = (rootFolders ?? []).filter((f) => f.id === null || !f.metadata).map((f) => f.name);
      if (folderIds.length > 0) {
        const { data: existing } = await admin
          .from("publications")
          .select("id")
          .in("id", folderIds);
        const existingSet = new Set((existing ?? []).map((p) => String(p.id)));
        for (const id of folderIds) if (!existingSet.has(id)) candidateIds.add(id);
      }
    }

    if (candidateIds.size === 0) {
      return new Response(JSON.stringify({ success: true, deleted: 0, scanned: 0, published: publishedIds.size }), {
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

      // limpiar referencias en publications (solo si la fila aún existe)
      if (publishedIds.has(pubId)) {
        await admin.from("publications").update({
          media_url: null,
          media_storage_path: null,
        }).eq("id", pubId);
      }
      console.log(`[cleanup] deleted ${paths.length} files from ${pubId}`);
    }

    return new Response(
      JSON.stringify({ success: true, dry_run: dryRun, publications: candidateIds.size, published: publishedIds.size, orphans: candidateIds.size - publishedIds.size, scanned: totalScanned, deleted: totalDeleted, cutoff }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[cleanup-meta-storage] fatal", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
