

## Issues Found

### 1. Drive folder generation error
The `handleGenerateDriveFolders` in `PublicationCalendarDialog.tsx` stores links as plain text (`material: URL`) but the `PublicationForm` reads/writes links as JSON (`[{label, url}]`). This mismatch corrupts the links field and causes errors when parsing.

**Fix**: Update `handleGenerateDriveFolders` to read existing links as JSON, append the new `{label: "material", url: ...}` entry, and save back as JSON string.

### 2. "Material general" button missing
The user wants a quick-add button in the links section of `PublicationForm` that:
- Only appears if the client has a `general` URL in their `clientInfo`
- Adds `{label: "material general", url: clientGeneralUrl}` to the links array
- Should not duplicate if already present

### Changes Required

**`src/components/client/publication/types.ts`**
- Add `clientGeneralUrl?: string` to `PublicationCalendarDialogProps`

**`src/components/client/card/PackageSection.tsx`**
- Pass `clientGeneralUrl={client.clientInfo?.general || ""}` to `ClientPackage`

**`src/components/client/ClientPackage.tsx`**
- Add `clientGeneralUrl` prop, pass it to `PublicationCalendarDialog`

**`src/components/client/PublicationCalendarDialog.tsx`**
- Accept `clientGeneralUrl` prop, pass it to `PublicationForm`
- Fix `handleGenerateDriveFolders`: parse existing links as JSON, merge new material link as `{label: "material", url}`, save as `JSON.stringify`

**`src/components/client/publication/PublicationForm.tsx`**
- Add `clientGeneralUrl?: string` prop
- Add "Añadir carpeta general" button in the links card section (only visible when `clientGeneralUrl` is non-empty)
- On click, add `{label: "material general", url: clientGeneralUrl}` to links array (skip if already exists)

