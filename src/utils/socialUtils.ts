/**
 * Given a social network platform and a value that may be a username, a full URL,
 * or a URL copied from the app, returns a valid profile URL.
 */

const PLATFORM_DOMAINS: Record<string, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
  tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
};

const PLATFORM_BASE: Record<string, (username: string) => string> = {
  instagram: (u) => `https://instagram.com/${u}`,
  facebook: (u) => `https://facebook.com/${u}`,
  tiktok: (u) => `https://tiktok.com/@${u.replace(/^@/, "")}`,
  linkedin: (u) => `https://linkedin.com/in/${u}`,
  twitter: (u) => `https://twitter.com/${u}`,
  youtube: (u) => `https://youtube.com/@${u.replace(/^@/, "")}`,
};

export function getSocialProfileUrl(platform: string, value: string): string {
  if (!value) return "";

  const trimmed = value.trim();

  // Already a full URL → use it directly
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Looks like a domain without protocol (e.g. "instagram.com/user")
  const knownDomains = Object.values(PLATFORM_DOMAINS).flat();
  if (knownDomains.some((d) => trimmed.toLowerCase().startsWith(d))) {
    return `https://${trimmed}`;
  }

  // Plain username → build URL
  const builder = PLATFORM_BASE[platform];
  if (builder) {
    return builder(trimmed.replace(/^@/, ""));
  }

  return trimmed;
}

/**
 * Extracts a display username from a value that may be a URL or a plain username.
 */
export function getDisplayUsername(platform: string, value: string): string {
  if (!value) return "";

  const trimmed = value.trim();

  // If it's a URL, try to extract the path username
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+|\/+$/g, "");
      // Remove common path prefixes
      const cleaned = path
        .replace(/^(in|company|channel|c)\//i, "")
        .replace(/^@/, "");
      return cleaned || trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed.replace(/^@/, "");
}
