import { useEffect, useState } from "react";

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
      <div>© Fabris Thee Luo Poet</div>
    </footer>
  );
}
