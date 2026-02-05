# Copilot Instructions for Fabris Thee Luo Poet

## Project Overview

**Fabris Thee Luo Poet** is a React + Vite web application for a poet's portfolio featuring poems, videos, live streams, and a creator dashboard. The app uses **Supabase for authentication and real-time data sync**, with dark/light theme support and CSS variable-based styling.

## Architecture & Data Flow

### Component Structure

- **Layout Components** (`src/components/layout/`): Header, Footer, Sidebar - persistent across routes
- **Reusable Components** (`src/components/`): PoemCard, VideoCard, Modal, IdentityMark
- **Pages** (`src/pages/`): Route-level components; dashboard has nested subroutes in `src/pages/dashboard/`
- **App Entry** (`src/app/App.jsx` + `src/app/routes.jsx`): Routes wrapped with Header/Footer layout

### Backend Integration: Supabase

**Auth Layer** (`src/context/AuthProvider.jsx`):

- Uses `supabase.auth.getSession()` and `onAuthStateChange()` for session management
- Provides `useAuth()` hook returning `{user, loading, signOut}`
- Dashboard (`/dashboard`) requires authenticated user; redirects to home if not logged in

**Data Queries** (`src/lib/db.js`):

- **`useSupabaseQuery(tableName)`** hook: Fetches data and subscribes to real-time updates via Postgres changes
- Handles fallback ordering (`created_at` → `updated_at` → no order) for schema flexibility
- Available tables: `poems`, `videos`, `comments`, `invites`, `media_assets`, `profiles`, `live_settings`, `notifications`

**CRUD Operations** (`src/lib/db.js`):

- `insertRecord(table, record)` — inserts and returns with ID
- `updateRecord(table, id, updates)` — partial update
- `deleteRecord(table, id)` — soft/hard delete based on table schema
- `deleteAll(table)` — clears entire table

**Example Usage**:

```javascript
const { data: poems, loading, refetch } = useSupabaseQuery("poems");
// Real-time sync happens automatically; call refetch() to manually refresh
```

### Theme System

**Location**: `src/hooks/useTheme.js`

- Reads theme from localStorage ("theme" key) or system preference
- Sets `data-theme` attribute on document root
- CSS variables in `src/styles/globals.css`: `:root` (light) and `[data-theme="dark"]` (dark)
- Use variables: `--bg`, `--text`, `--muted`, `--accent`, etc.

Always reference CSS variables in styles:

```css
color: var(--text);
background: var(--bg);
```

### Routing Structure

**Public pages**: `/`, `/poems`, `/poems/:id`, `/videos`, `/live`, `/invite`, `/brand`, `/secret-login`

**Dashboard** (`/dashboard`): Requires Supabase auth. Nested subroutes:

- `/dashboard` (Overview)
- `/dashboard/poems`, `/dashboard/videos`, `/dashboard/live`
- `/dashboard/comments`, `/dashboard/invites`, `/dashboard/notifications`
- `/dashboard/upload` (Media), `/dashboard/settings`

**Dashboard State** (`src/pages/Dashboard.jsx`):

- `DashboardContext` provides shared state via `useDashboardContext()` hook
- Fetches all Supabase tables and passes refetch functions to child pages
- Page title updates dynamically based on route

### Styling Approach

- **CSS-in-JS inline styles** for component-level styling (Modal.jsx, Header.jsx)
- **Global CSS** (`src/styles/globals.css`) for layout, typography, theme variables
- **Utility classes** for pages: `.page`, `.list-card`, `.form-group`, etc.
- **No CSS modules or Tailwind** — preserve consistency with plain CSS

## Development Workflows

### Build & Run

```bash
npm run dev      # Start Vite dev server (http://localhost:5173, HMR enabled)
npm run build    # Production build → dist/
npm run lint     # ESLint check
npm run preview  # Preview production build locally
```

### Environment Setup

Create `.env` file (never commit—already in .gitignore):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `SUPABASE_SETUP.md` for table schemas and Supabase configuration.

### Common Tasks

**Add a new page**: Create component in `src/pages/`, import in `src/app/routes.jsx`, add Route.

**Add a dashboard subroute**: Create in `src/pages/dashboard/`, add Route under `/dashboard` parent in `src/app/routes.jsx`. Access shared state via `useDashboardContext()`.

**Modify theme**: Update CSS variables in `:root` and `[data-theme="dark"]` in `src/styles/globals.css`, NOT inline component styles.

**Add a Supabase table query**: Use `const { data, loading, refetch } = useSupabaseQuery('tableName')` in components.

**Persist new data**: Use `useSupabaseQuery()` in Dashboard.jsx, pass state + refetch to children via context.

## Project-Specific Conventions

1. **Imports**: Use relative paths (`../components/`), not absolute aliases
2. **Component exports**: Default exports with named component functions
3. **Event handlers**: Arrow functions, props passed directly (e.g., `onClose={() => setOpen(false)}`)
4. **Date formatting**: Use `formatDate()` utility from Dashboard.jsx for ISO string formatting
5. **Accessibility**: Semantic HTML (article, main), ARIA on interactive elements (role, aria-label, aria-modal)
6. **Hooks first**: Use hooks (useState, useEffect, useSupabaseQuery) over class components
7. **Modal pattern**: Use Modal.jsx with `open` prop and `onClose` callback; modal manages backdrop/close button
8. **Auth checks**: Always check `useAuth()` in dashboard pages; let Dashboard.jsx handle redirect logic

## Critical Data Patterns

### ✅ Correct: Using Supabase for real-time data

```javascript
const DashboardComponent = () => {
  const { data: poems, loading, refetch } = useSupabaseQuery("poems");

  const addPoem = async (newPoem) => {
    const { data } = await insertRecord("poems", newPoem);
    refetch(); // Trigger refetch or rely on real-time subscription
  };
};
```

### ❌ Incorrect: Direct fetch without subscription

```javascript
const [poems, setPoems] = useState([]);
useEffect(() => {
  supabase
    .from("poems")
    .select()
    .then((res) => setPoems(res.data));
  // No real-time sync, won't update when other users add poems
}, []);
```

## Common Pitfalls

- **Missing auth check**: Don't assume user exists in Dashboard—check `useAuth()` first
- **No real-time subscription**: Use `useSupabaseQuery()` not raw `supabase.from()` calls
- **Stale data**: Call `refetch()` after insertRecord/updateRecord or rely on real-time channel
- **Hardcoded colors**: Use CSS variables; breaks dark mode if you don't
- **Import paths**: Use relative paths; absolute imports not configured
- **Modal click handling**: Use `onClick={(e) => e.stopPropagation()}` on child elements to prevent backdrop close
- **Mixed localStorage patterns**: The old `useLocalResource` hook is no longer the primary pattern—use Supabase for persistent data

## Integration Points & Dependencies

- **React 19.2.0** + React DOM 19.2.0
- **React Router 7.13.0**: BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Outlet
- **@supabase/supabase-js 2.43.0**: Auth, real-time updates, CRUD operations
- **Vite 7.2.4** + @vitejs/plugin-react (Babel Fast Refresh)
- **ESLint 9.39.1** with react-hooks and react-refresh rules
