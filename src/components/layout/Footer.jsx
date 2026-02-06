import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iconClicks, setIconClicks] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Reset icon clicks after 3 seconds of inactivity
  useEffect(() => {
    if (iconClicks === 0) return;
    const timer = setTimeout(() => {
      setIconClicks(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [iconClicks]);

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newClicks = iconClicks + 1;
    setIconClicks(newClicks);
    if (newClicks === 5) {
      navigate("/secret-login");
      setIconClicks(0);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <footer className="footer">
      {deferredPrompt && (
        <button onClick={installApp}>Install App</button>
      )}
      <div onClick={handleCopyrightClick} style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'inherit', padding: '0.5rem', marginLeft: '-0.5rem' }}>
        <div>© Fabris Thee Luo Poet</div>
        {showAdminLink && (
          <Link to="/secret-login" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }} onClick={(e) => { e.stopPropagation(); setCopyrightClicks(0); setShowAdminLink(false); }}>🔐 Admin</Link>
        )}
      </div>
    </footer>
  );
}
