'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: () => void } }
}

function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (scriptReady && ref.current && window.turnstile) {
      window.turnstile.render(ref.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: onToken,
      });
    }
  }, [scriptReady]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={() => setScriptReady(true)} />
      <div ref={ref} />
    </>
  );
}

function PasswordInput(props: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={visible ? 'text' : 'password'} required minLength={6} placeholder={props.placeholder}
        value={props.value} onChange={e => props.onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 40 }} />
      <button type="button" onClick={() => setVisible(v => !v)} tabIndex={-1}
        style={{ position: 'absolute', right: 10, top: 0, bottom: 0, background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {visible ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>
    </div>
  );
}

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
      window.turnstile?.reset();
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
      window.turnstile?.reset();
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
            <PasswordInput placeholder="Password" value={password} onChange={setPassword} />
            {mode === 'signup' && (
              <PasswordInput placeholder="Konfirmasi Password" value={confirmPassword} onChange={setConfirmPassword} />
            )}
            <Turnstile onToken={setCaptchaToken} />
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
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#121212', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter,sans-serif',
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
