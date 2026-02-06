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
            <Link to="/dashboard/library" className={location.pathname === '/dashboard/library' ? 'active' : ''} onClick={onClose}>📚 Library</Link>
            <Link to="/dashboard/settings" className={location.pathname === '/dashboard/settings' ? 'active' : ''} onClick={onClose}>⚙️ Settings</Link>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ background: 'var(--accent)', border: 'none', textAlign: 'center', cursor: 'pointer', padding: '10px 16px', width: '100%', color: 'var(--text)', fontFamily: 'inherit' }}>
              {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
            </button>
            <AuthControls onClose={onClose} />
          </>
        ) : (
          // Public site navigation
          <>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={onClose}>Home</Link>
            <Link to="/poems" className={location.pathname === '/poems' ? 'active' : ''} onClick={onClose}>Poems</Link>
            <Link to="/videos" className={location.pathname === '/videos' ? 'active' : ''} onClick={onClose}>Videos</Link>
            <Link to="/live" className={location.pathname === '/live' ? 'active' : ''} onClick={onClose}>Live</Link>
            <Link to="/invite" className={location.pathname === '/invite' ? 'active' : ''} onClick={onClose}>Invite</Link>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ background: 'var(--accent)', border: 'none', textAlign: 'center', cursor: 'pointer', padding: '10px 16px', width: '100%', color: 'var(--text)', fontFamily: 'inherit' }}>
              {theme === 'dark' ? '🌙 Dark' : '🌞 Light'}
            </button>
            <AuthControls onClose={onClose} />
          </>
        )}
      </nav>
      </aside>
    </>
  );
}

function AuthControls({ onClose }) {
  const { user, signOut } = useAuth();

  // Only show sign-out if user is authenticated
  if (!user) return null;

  const handleSignOut = async () => {
    const res = await signOut();
    if (res && res.success) {
      if (typeof onClose === 'function') onClose();
    }
  };

  return (
    <button onClick={handleSignOut} style={{ background: 'var(--accent)', border: 'none', textAlign: 'center', cursor: 'pointer', padding: '10px 16px', width: '100%', color: 'var(--text)', fontFamily: 'inherit' }}>🚪 Sign out</button>
  );
}
