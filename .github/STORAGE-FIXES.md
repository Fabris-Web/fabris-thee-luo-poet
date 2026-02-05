# Storage & Data Persistence Fixes

## Summary

Fixed critical data persistence issues across the codebase to ensure localStorage data is saved properly and accessed consistently by all UI components.

## Issues Fixed

### 1. **Media.jsx: Undefined `onDelete` reference**

- **File**: [src/pages/dashboard/Media.jsx](src/pages/dashboard/Media.jsx#L113)
- **Issue**: Delete button referenced `onDelete()` which didn't exist in scope
- **Fix**: Changed to `deleteMediaPost()` from useDashboardContext
- **Impact**: Delete buttons in media management now work correctly

### 2. **Dashboard.jsx: Profile image not syncing across tabs**

- **File**: [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx#L54)
- **Issue**: `profileImage` used `useState` with `read()` instead of `useLocalResource()`
  ```javascript
  // ❌ Before: No multi-tab sync
  const [profileImage, setProfileImage] = useState(() =>
    read(STORAGE.profile, ""),
  );
  ```
- **Fix**: Changed to use `useLocalResource()` for proper sync
  ```javascript
  // ✅ After: Full multi-tab sync
  const [profileImage, setProfileImage] = useLocalResource(STORAGE.profile, "");
  ```
- **Impact**: Profile image updates now sync across browser tabs/windows

### 3. **Dashboard.jsx: Manual localStorage.removeItem() bypass**

- **File**: [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx#L117)
- **Issue**: `clearAllInvites()` called `localStorage.removeItem()` directly, bypassing event broadcasting
  ```javascript
  // ❌ Before: Bypassed write() sync
  const clearAllInvites = () => {
    setInvites([]);
    localStorage.removeItem(STORAGE.invites);
  };
  ```
- **Fix**: Removed manual localStorage call—`useLocalResource` setter handles everything
  ```javascript
  // ✅ After: Uses built-in sync mechanism
  const clearAllInvites = () => {
    setInvites([]);
  };
  ```
- **Impact**: Clearing invites now broadcasts properly via `flp-data-updated` events

### 4. **Poem.jsx: Reflections using mixed read/write pattern**

- **File**: [src/pages/Poem.jsx](src/pages/Poem.jsx#L1)
- **Issue**: Reflections used `useState` + `read()`/`write()` instead of `useLocalResource()`, breaking multi-tab sync

  ```javascript
  // ❌ Before: Manual read/write
  const [reflectionsMap, setReflectionsMap] = useState(() =>
    read("flp_reflections", {}),
  );

  const addReflection = (poemId, payload) => {
    const current = read("flp_reflections", {}); // Reads stale data
    // ... mutation logic ...
    write("flp_reflections", current); // Manual write
  };
  ```

- **Fix**: Switched to `useLocalResource()` for automatic sync

  ```javascript
  // ✅ After: Built-in sync
  const [reflectionsMap, setReflectionsMap] = useLocalResource(
    "flp_reflections",
    {},
  );

  const addReflection = (poemId, payload) => {
    const current = reflectionsMap; // Always fresh
    const updated = { ...current, [poemId]: next };
    setReflectionsMap(updated); // Auto-sync via setter
  };
  ```

- **Impact**: Reflections now sync instantly across tabs and persist reliably

## Pattern Standardization

All data now follows the consistent pattern:

```javascript
// Import
import { useLocalResource } from "../lib/storage";

// Use the hook for ALL persistent state
const [state, setState] = useLocalResource("flp_key", defaultValue);

// Update via setter—no manual write() calls needed
setState(newValue);

// ✅ This handles:
// - Persisting to localStorage automatically
// - Broadcasting flp-data-updated events (same-tab listeners)
// - Broadcasting storage events (other-tab listeners)
// - Fallback to defaultValue on parse errors
```

## Verification

To verify fixes work correctly:

1. **Multi-tab sync test**: Open app in two browser windows, edit data in one, watch it appear in the other
2. **Persistence test**: Add data, refresh the page, verify it still exists
3. **No console errors**: Check browser console for any storage-related errors
4. **Delete operations**: Verify all delete buttons work without errors

## Updated Guidance

See `.github/copilot-instructions.md` for updated data persistence best practices section with examples.
