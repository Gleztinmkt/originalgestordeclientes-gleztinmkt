/**
 * Extracts a Google Drive folder/file ID from various URL formats.
 * Supports:
 * - https://drive.google.com/open?id=XXXXX
 * - https://drive.google.com/open?id=XXXXX&usp=drive_fs
 * - https://drive.google.com/drive/folders/XXXXX
 * - https://drive.google.com/drive/folders/XXXXX?usp=sharing
 * - https://drive.google.com/drive/u/0/folders/XXXXX
 * - Raw folder ID (no URL)
 */
export function extractDriveFolderId(url: string): string {
  if (!url) return "";

  // Try ?id= parameter (open?id=XXXXX or file/d/XXXXX)
  const idParam = url.match(/[?&]id=([^&]+)/);
  if (idParam) return idParam[1];

  // Try /folders/XXXXX or /file/d/XXXXX
  const pathMatch = url.match(/\/(?:folders|file\/d)\/([^/?]+)/);
  if (pathMatch) return pathMatch[1];

  // If no URL pattern matched, assume it's already a raw ID
  return url;
}
