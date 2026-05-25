import { corsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlEncode(value: Uint8Array) {
  let binary = "";
  for (const b of value) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payloadBase64: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadBase64));
  return base64UrlEncode(new Uint8Array(signature));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    const secret = Deno.env.get("META_APP_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY || !secret) {
      return new Response("Media proxy not configured", { status: 500, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature || signature !== await signPayload(payloadBase64, secret)) {
      return new Response("Invalid media token", { status: 403, headers: corsHeaders });
    }

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadBase64))) as {
      fileId?: string;
      fileName?: string;
      contentType?: string;
      exp?: number;
    };
    if (!payload.fileId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return new Response("Expired media token", { status: 403, headers: corsHeaders });
    }

    const driveRes = await fetch(`${GATEWAY_URL}/files/${payload.fileId}?alt=media&supportsAllDrives=true`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
        ...(req.headers.get("range") ? { Range: req.headers.get("range")! } : {}),
      },
    });
    if (!driveRes.ok && driveRes.status !== 206) {
      const text = await driveRes.text();
      return new Response(`Drive download ${driveRes.status}: ${text.slice(0, 200)}`, { status: 502, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", payload.contentType || driveRes.headers.get("content-type") || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=604800, immutable");
    for (const key of ["content-length", "content-range", "accept-ranges"] as const) {
      const value = driveRes.headers.get(key);
      if (value) headers.set(key, value);
    }

    return new Response(driveRes.body, { status: driveRes.status, headers });
  } catch (e) {
    return new Response(String((e as Error)?.message || e), { status: 500, headers: corsHeaders });
  }
});