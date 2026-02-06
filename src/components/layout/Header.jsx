import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { fetchVideoById } from "../../lib/db";
import { trimToWords } from "../../lib/format";

function titleFromPath(pathname) {
  if (!pathname) return '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';
  // handle /dashboard subroutes
  if (segments[0] === 'dashboard') {
    if (segments.length === 1) return 'Dashboard';
    const map = {
      poems: 'Poems',
      videos: 'Videos',
      live: 'Live',
      comments: 'Comments',
      invites: 'Invites',
      notifications: 'Notifications',
      upload: 'Upload',
      settings: 'Settings',
    };
    return map[segments[1]] || 'Dashboard';
  }

  const map = {
    poems: 'Poems',
    videos: 'Videos',
    live: 'Live',
    invite: 'Invite',
    brand: 'Brand',
  };
  return map[segments[0]] || segments[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);


  let pageTitle = titleFromPath(location.pathname);

  // Computed title state used when viewing a single video
  const [computedTitle, setComputedTitle] = useState('');

  // If viewing a specific video page (/videos/:id), fetch that single video's title
  useEffect(() => {
    let mounted = true;
    
    // If NOT on videos/:id page, clear computed title
    if (segments[0] !== 'videos' || !segments[1]) {
      setComputedTitle('');
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await fetchVideoById(segments[1]);
        if (error) return;
        if (!mounted) return;
        if (data && data.title) {
          setComputedTitle(data.title);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [location.pathname]);

  if (computedTitle) pageTitle = computedTitle;

  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <header className="header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button aria-label="Toggle sidebar" onClick={() => setOpen((s) => !s)} className="sidebar-toggle">☰</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center', fontWeight: 700 }}>{trimToWords(pageTitle)}</div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/" className="brand">
            <img src="/MyLogo.png" alt="Fabris Thee Luo Poet" />
          </Link>
        </div>
      </header>
    </>
  );
}
