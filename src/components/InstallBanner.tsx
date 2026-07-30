'use client';
import { useEffect, useState } from 'react';

const KEY = 'mkmusic_install_banner';
const COOLDOWN_DAYS = 4;
const MAX_DISMISSES = 3;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Occasional, not every visit: skip entirely once dismissed 3 times, and
// otherwise wait at least 4 days between showings so it doesn't nag.
function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : { lastShown: 0, dismissCount: 0 };
    if (state.installed || state.dismissCount >= MAX_DISMISSES) return false;
    const daysSinceLast = (Date.now() - (state.lastShown || 0)) / 86400000;
    return daysSinceLast >= COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

function recordShown() {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : { dismissCount: 0 };
    state.lastShown = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function recordDismiss() {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : { dismissCount: 0 };
    state.dismissCount = (state.dismissCount || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function recordInstalled() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ installed: true }));
  } catch {}
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) { recordInstalled(); return; }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      if (shouldShow()) {
        recordShown();
        setTimeout(() => setShow(true), 3000);
      }
    }
    function onInstalled() {
      recordInstalled();
      setShow(false);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show || !prompt) return null;

  function dismiss() {
    recordDismiss();
    setShow(false);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') recordInstalled();
    else recordDismiss();
    setShow(false);
  }

  return (
    <div className="install-banner">
      <span className="install-banner-icon">📲</span>
      <p className="install-banner-text">mkmusic bisa diinstall biar akses lebih cepat, loh!</p>
      <button className="install-banner-cta" onClick={install}>Install</button>
      <button className="install-banner-close" onClick={dismiss} aria-label="Tutup">✕</button>
    </div>
  );
}
