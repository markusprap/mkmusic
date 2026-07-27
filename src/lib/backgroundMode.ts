const KEY = 'mkmusic_background_mode';

// Device/browser preference, not an account setting — whether this Player
// instance uses the stable YouTube iframe (default) or the native <audio>
// engine that can survive being backgrounded on mobile.
export function isBackgroundModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === '1';
}

export function setBackgroundModeEnabled(enabled: boolean) {
  localStorage.setItem(KEY, enabled ? '1' : '0');
}

// Flips the flag and reloads — Player.tsx only reads it once per mount, so
// a toggle needs a fresh load to actually switch engines.
export function toggleBackgroundMode() {
  setBackgroundModeEnabled(!isBackgroundModeEnabled());
  location.reload();
}
