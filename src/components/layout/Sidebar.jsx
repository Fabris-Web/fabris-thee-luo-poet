import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthProvider";

export default function Sidebar({ open, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden />}
      <aside className={`sidebar ${open ? 'open' : ''}`} inert={!open}>
      <nav>
        {isDashboard ? (
          // Dashboard-specific navigation
          <>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''} onClick={onClose}>📊 Overview</Link>
            <Link to="/dashboard/poems" className={location.pathname === '/dashboard/poems' ? 'active' : ''} onClick={onClose}>✍️ Poems</Link>
            <Link to="/dashboard/videos" className={location.pathname === '/dashboard/videos' ? 'active' : ''} onClick={onClose}>🎥 Videos</Link>
            <Link to="/dashboard/live" className={location.pathname === '/dashboard/live' ? 'active' : ''} onClick={onClose}>🔴 Live</Link>
            <Link to="/dashboard/comments" className={location.pathname === '/dashboard/comments' ? 'active' : ''} onClick={onClose}>💬 Comments</Link>
            <Link to="/dashboard/invites" className={location.pathname === '/dashboard/invites' ? 'active' : ''} onClick={onClose}>📩 Invites</Link>
            <Link to="/dashboard/notifications" className={location.pathname === '/dashboard/notifications' ? 'active' : ''} onClick={onClose}>🔔 Notifications</Link>
            <Link to="/dashboard/upload" className={location.pathname === '/dashboard/upload' ? 'active' : ''} onClick={onClose}>📤 Upload</Link>
            <Link to="/dashboard/library" className={location.pathname === '/dashboard/library' ? 'active' : ''} onClick={onClose}>📚 Library</Link>
            <Link to="/dashboard/settings" className={location.pathname === '/dashboard/settings' ? 'active' : ''} onClick={onClose}>⚙️ Settings</Link>
          </>
        ) : (
          // Public site navigation
          <>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={onClose}>Home</Link>
            <Link to="/poems" className={location.pathname === '/poems' ? 'active' : ''} onClick={onClose}>Poems</Link>
            <Link to="/videos" className={location.pathname === '/videos' ? 'active' : ''} onClick={onClose}>Videos</Link>
            <Link to="/live" className={location.pathname === '/live' ? 'active' : ''} onClick={onClose}>Live</Link>
            <Link to="/invite" className={location.pathname === '/invite' ? 'active' : ''} onClick={onClose}>Invite</Link>
            {import.meta.env.DEV && (
              <Link to="/secret-login" className="dev-login" onClick={onClose} style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                🔐 Dev Login
              </Link>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
          </button>

          <AuthControls />
        </div>
      </div>
      </aside>
    </>
  );
}

function AuthControls() {
  const { user, signOut } = useAuth();

  // Only show sign-out if user is authenticated
  if (!user) return null;

  return (
    <button onClick={() => signOut()} className="btn">Sign out</button>
  );
}
