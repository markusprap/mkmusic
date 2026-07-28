'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from './PasswordInput';

type Mode = 'signin' | 'signup';

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (widgetId?: string) => void } }
}

export interface TurnstileHandle { reset: () => void }

const Turnstile = forwardRef<TurnstileHandle, { onToken: (t: string) => void }>(({ onToken }, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (scriptReady && container.current && window.turnstile) {
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: onToken,
      });
    }
  }, [scriptReady]);

  useImperativeHandle(ref, () => ({
    reset: () => { if (widgetId.current) window.turnstile?.reset(widgetId.current); },
  }));

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={() => setScriptReady(true)} />
      <div ref={container} />
    </>
  );
});
Turnstile.displayName = 'Turnstile';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [successMsg, setSuccessMsg] = useState('');

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (mode === 'signup' && password !== confirmPassword) {
      return setError('Konfirmasi password tidak cocok');
    }
    if (!captchaToken) return setError('Selesaikan verifikasi captcha dulu');
    setBusy(true);
    const supabase = createClient();
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, captchaToken } });
      setBusy(false);
      turnstileRef.current?.reset();
      setCaptchaToken('');
      if (error) return setError(error.message);
      if (data.session) {
        // Confirm-email off: signUp already logs in — sign back out so the user logs in explicitly.
        await supabase.auth.signOut();
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg('Akun berhasil dibuat, silakan masuk');
      } else {
        setCheckEmail(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      setBusy(false);
      turnstileRef.current?.reset();
      setCaptchaToken('');
      if (error) return setError(error.message);
      location.reload();
    }
  }

  return (
    <div style={screenStyle}>
      <img src="/logo.png" alt="mkmusic" style={{ width: 120, height: 120, marginBottom: 24 }} />
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 24 }}>mkmusic</h1>

      {checkEmail ? (
        <p style={{ color: '#b3b3b3', fontSize: 14, maxWidth: 300, textAlign: 'center' }}>
          Cek email kamu ({email}) untuk konfirmasi akun, lalu masuk lagi.
        </p>
      ) : (
        <div style={{ width: 300 }}>
          <button onClick={handleGoogle} style={googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.6z"/><path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.3 46 24 46z"/><path fill="#FBBC05" d="M11.6 28.1c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z"/><path fill="#EA4335" d="M24 10.7c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4.3 30 2 24 2 15.3 2 7.9 7 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.2 12.4-9.2z"/></svg>
            Masuk dengan Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: '#727272', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
            atau
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'signup' && (
              <input required placeholder="Nama" value={name}
                onChange={e => setName(e.target.value)} style={inputStyle} />
            )}
            <input type="email" required placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <PasswordInput required placeholder="Password" value={password} onChange={setPassword} />
            {mode === 'signup' && (
              <PasswordInput required placeholder="Konfirmasi Password" value={confirmPassword} onChange={setConfirmPassword} />
            )}
            <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />
            {successMsg && <p style={{ color: '#1db954', fontSize: 13 }}>{successMsg}</p>}
            {error && <p style={{ color: '#f44336', fontSize: 13 }}>{error}</p>}
            <button type="submit" disabled={busy} style={primaryBtn}>
              {mode === 'signup' ? 'Daftar' : 'Masuk'}
            </button>
          </form>

          <button onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setSuccessMsg(''); setName(''); setConfirmPassword(''); }}
            style={{ marginTop: 14, background: 'none', border: 'none', color: '#b3b3b3', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'center' }}>
            {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </button>
        </div>
      )}

      <p style={{ marginTop: 32, color: '#727272', fontSize: 12, textAlign: 'center' }}>
        Made just for you — by{' '}
        <a href="https://www.instagram.com/markusprap/" target="_blank" rel="noopener noreferrer" style={{ color: '#b3b3b3' }}>
          Markus Prap Kurniawan
        </a>
      </p>
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#121212', display: 'flex', flexDirection: 'column',
  alignItems: 'center', padding: '48px 24px', fontFamily: 'Inter,sans-serif', overflowY: 'auto',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '12px 14px',
  color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
};

const primaryBtn: React.CSSProperties = {
  background: '#1db954', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};

const googleBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  background: '#fff', color: '#000', border: 'none', borderRadius: 24, padding: '12px',
  fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
};
