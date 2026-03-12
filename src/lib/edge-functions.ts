import { supabase } from "@/integrations/supabase/client";

export type PublicationType = "reel" | "carousel" | "image";

const BULLET_CHARS_REGEX = /[•●○▪▫◆◇◦]/g;
const TITLE_PREFIX_REGEX = /^\s*(\d+[.)-]?\s*)?(reel|video|clip|post|imagen|image|foto|carrusel|carousel|slide[s]?)\s*[-:–]?\s*/i;

const safeText = (value?: string | null) =>
  (value ?? "")
    .replace(BULLET_CHARS_REGEX, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const cleanAiTitle = (value?: string | null) => safeText(value).replace(TITLE_PREFIX_REGEX, "").trim();

export const cleanAiText = (value?: string | null) => safeText(value);

export const normalizePublicationType = (
  type: unknown,
  title?: string | null,
  description?: string | null,
): PublicationType => {
  const direct = String(type ?? "").toLowerCase();
  if (direct === "reel" || direct === "carousel" || direct === "image") {
    return direct;
  }

  const source = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (/(reel|video|clip|grabaci[oó]n|filmaci[oó]n)/.test(source)) return "reel";
  if (/(carrusel|carousel|slide|slides)/.test(source)) return "carousel";
  return "image";
};

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
};

export const normalizeAiLinks = (links: unknown): Array<{ label: string; url: string }> => {
  if (!Array.isArray(links)) return [];

  const normalized = links
    .map((link) => {
      if (!link || typeof link !== "object") return null;
      const candidate = link as { label?: string; url?: string };
      const url = normalizeUrl(candidate.url ?? "");
      if (!url) return null;

      return {
        label: cleanAiText(candidate.label) || "Enlace",
        url,
      };
    })
    .filter((item): item is { label: string; url: string } => Boolean(item));

  const seen = new Set<string>();
  return normalized.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

const isTransportError = (error: { message?: string } | null) =>
  Boolean(error?.message?.toLowerCase().includes("failed to send a request to the edge function"));

export async function invokeEdgeFunction<TResponse, TBody = unknown>(
  functionName: string,
  body: TBody,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (!error) {
    return data as TResponse;
  }

  if (!isTransportError(error)) {
    throw error;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con la función. Recargá la app e intentá nuevamente.");
  }

  const raw = await response.text();
  let parsed: unknown = null;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { error: raw };
  }

  if (!response.ok) {
    const errorMessage =
      typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error?: string }).error)
        : `Error ${response.status} al ejecutar ${functionName}`;

    throw new Error(errorMessage);
  }

  return parsed as TResponse;
}
