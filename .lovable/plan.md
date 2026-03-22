

## Problem

1. **Calendar resets when switching tabs**: The `CalendarView` uses a `key={`calendar-${refreshKey}`}` prop, and the `Tabs` component unmounts inactive tab content. Every tab switch destroys and recreates the calendar, losing filters, selected month, and scroll position.

2. **Slow loading**: The query fetches ALL publications with `staleTime: 0`, re-fetching every time the component mounts. The batched fetch loop and rendering hundreds of `Droppable`/`Draggable` components adds overhead.

## Solution

### 1. Persist calendar state across tab switches

Replace `TabsContent` conditional rendering with CSS-based visibility. Instead of mounting/unmounting, all tabs stay mounted but hidden via `display: none` / `display: block`. This preserves the calendar's internal state (filters, month, scroll) when switching tabs.

**File**: `src/pages/Index.tsx`
- Remove the `key` prop from `CalendarView` (no more `refreshKey` forcing remount)
- Replace all `<TabsContent>` wrappers with `<div>` wrappers that use a tracked `activeTab` state
- Each tab div gets `style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}` instead of being conditionally rendered
- Add `onValueChange` to `<Tabs>` to track the active tab

### 2. Optimize publication fetching with caching

**File**: `src/components/calendar/CalendarView.tsx`
- Change `staleTime: 0` to `staleTime: 5 * 60 * 1000` (5 minutes) so data is cached and not re-fetched on every mount
- Remove the `selectedClient` from the query key — instead fetch ALL publications once and filter client-side (avoids re-fetching when changing client filter)
- Add `gcTime: 10 * 60 * 1000` so cached data persists even when unmounted

### 3. Optimize rendering performance

**File**: `src/components/calendar/CalendarView.tsx`
- Wrap `filteredPublications` computation in `useMemo` to avoid recalculating on every render
- Memoize `daysInMonth` and `allDays` with `useMemo`
- Remove the fake loading progress bar effect (it's artificial and adds delay) — use the actual query `isLoading` state instead

### 4. Keep publication count accurate

The total count badge (`filteredPublications.length`) will continue showing filtered count since the filtering logic remains unchanged — it just runs against cached data instead of re-fetched data.

## Technical details

The key insight is using CSS visibility instead of React conditional rendering for tabs. This is a well-known pattern for tab persistence:

```text
Before:  <TabsContent value="calendar">  → unmounts when inactive
After:   <div hidden={activeTab !== 'calendar'}>  → stays mounted, just hidden
```

Files to modify:
1. `src/pages/Index.tsx` — Tab persistence with CSS visibility
2. `src/components/calendar/CalendarView.tsx` — Query caching + useMemo optimizations

