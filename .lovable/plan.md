

## Problem Diagnosis

The root cause is a **race condition** between the role query and the initial render:

1. `useQuery` for `userRole` starts as `undefined` while loading.
2. The `Tabs` component uses `defaultValue={userRole === 'admin' ? "clients" : "calendar"}` -- since `userRole` is `undefined` on first render, it defaults to `"calendar"`.
3. `defaultValue` is only evaluated once by Radix Tabs (on mount). Even after the role loads as `'admin'`, the tab stays on "calendar".
4. Similarly, all `{userRole === 'admin' && ...}` blocks render nothing initially, making it look like a designer view.

The loading screen only waits for `loadClients`/`loadTasks`, not the role query.

## Plan

### 1. Wait for role query before rendering content

- Extract `isLoading: isRoleLoading` from the `useQuery` call for `userRole`.
- Include `isRoleLoading` in the loading condition so the splash screen stays visible until the role is resolved.
- This ensures `userRole` has a definitive value before `Tabs` mounts and sets its `defaultValue`.

### 2. Change to controlled Tabs (optional but safer)

- Switch from `defaultValue` to a controlled `value` state that updates when `userRole` changes, preventing stale tab selection if the role loads after mount.

### Technical changes

**File: `src/pages/Index.tsx`**
- Add `isLoading: isRoleLoading` to the `useQuery` destructure.
- Update the loading check: `if (isLoading || isRoleLoading)` to show splash screen.
- Optionally add controlled tab state: `const [activeTab, setActiveTab] = useState("calendar")` and update it via `useEffect` when `userRole` changes.

This is a small, focused fix -- approximately 5-10 lines changed.

