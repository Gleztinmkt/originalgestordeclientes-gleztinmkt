

## Problem

When creating calendar folders for "Italia Pastas", the Google Apps Script fails because it can't extract the folder ID from the URL format:
```
https://drive.google.com/open?id=1-PqrIT_wRj_PAYeS74qGf9fmHQPfumVr&usp=drive_fs
```

The script only recognizes some Drive URL patterns but not this one (`/open?id=...`).

## Solution

Extract the Google Drive folder ID on the frontend before sending it to the Apps Script. This way, regardless of what URL format the user pasted, the script always receives a clean folder ID.

## Changes

### 1. Create a utility function to extract Drive folder IDs

**File**: `src/utils/driveUtils.ts` (new)

A function `extractDriveFolderId(url)` that handles all common Google Drive URL formats:
- `https://drive.google.com/open?id=XXXXX`
- `https://drive.google.com/open?id=XXXXX&usp=drive_fs`
- `https://drive.google.com/drive/folders/XXXXX`
- `https://drive.google.com/drive/folders/XXXXX?usp=sharing`
- `https://drive.google.com/drive/u/0/folders/XXXXX`
- Raw folder ID (no URL)

Returns the extracted ID or the original string if no pattern matches.

### 2. Use the utility in PublicationCalendarDialog

**File**: `src/components/client/PublicationCalendarDialog.tsx`

In both `handleGenerateDriveFolders` and `handleSyncDriveLinks`, replace:
```
urlMaterial: clientMaterialUrl || ""
```
with:
```
urlMaterial: extractDriveFolderId(clientMaterialUrl || "")
```

This sends a clean folder ID to the Apps Script, avoiding the parsing error entirely.

