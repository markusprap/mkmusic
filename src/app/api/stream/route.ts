import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Direct-audio-URL extraction for the opt-in "Background Mode" — same
// three-tier fallback chain analyzed from a similar public project
// (Savetube -> Cobalt -> lexcode). None of this runs unless the user
// explicitly enables Background Mode; the default Player uses the
// official YouTube iframe embed instead.

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 12000): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return await res.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---- Method 1: Savetube CDN ----
async function getFromSavetube(videoId: string, ytUrl: string): Promise<string | null> {
  const cdnRes = await fetchJson('https://media.savetube.vip/api/random-cdn', undefined, 10000);
  let cdns: string[] = Array.isArray(cdnRes?.cdns) ? cdnRes.cdns : cdnRes?.cdn ? [cdnRes.cdn] : [];
  if (cdns.length === 0) cdns = ['cdn305.savetube.vip', 'cdn105.savetube.vip'];

  const headers = { 'Content-Type': 'application/json', origin: 'https://yt.savetube.me' };
  for (const cdn of cdns) {
    try {
      const infoRes = await fetchJson(`https://${cdn}/v2/info`, { method: 'POST', headers, body: JSON.stringify({ url: ytUrl }) });
      const encData = infoRes?.data;
      if (!encData) continue;

      const encrypted = Buffer.from(encData, 'base64');
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex'), encrypted.subarray(0, 16));
      const decrypted = JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(16)), decipher.final()]).toString());
      if (!decrypted.key) continue;

      const dlRes = await fetchJson(`https://${cdn}/download`, {
        method: 'POST', headers, body: JSON.stringify({ id: videoId, downloadType: 'audio', quality: '128', key: decrypted.key }),
      });
      const downloadUrl = dlRes?.data?.downloadUrl || dlRes?.downloadUrl;
      if (downloadUrl) return downloadUrl;
    } catch {
      continue;
    }
  }
  return null;
}

// ---- Method 2: Cobalt ----
async function getFromCobalt(ytUrl: string): Promise<string | null> {
  for (const instance of ['https://api.cobalt.tools/api/json', 'https://co.wuk.sh/api/json']) {
    const r = await fetchJson(instance, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url: ytUrl, downloadMode: 'audio', audioFormat: 'mp3', audioBitrate: '128' }),
    }, 10000);
    if (r?.url) return r.url;
  }
  return null;
}

// ---- Method 3: lexcode (last-resort aggregator) ----
function findAudioUrl(obj: any, depth = 0): string | null {
  if (depth > 10 || !obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    for (const item of obj) { const f = findAudioUrl(item, depth + 1); if (f) return f; }
    return null;
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && /^https?:\/\//.test(val) && (val.includes('.mp3') || val.includes('audio') || val.includes('stream'))) return val;
    if (typeof val === 'object') { const f = findAudioUrl(val, depth + 1); if (f) return f; }
  }
  return null;
}
async function getFromLexcode(ytUrl: string): Promise<string | null> {
  const r = await fetchJson(`https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodeURIComponent(ytUrl)}`, undefined, 20000);
  return r ? findAudioUrl(r) : null;
}

// GET /api/stream?videoId=xxx — direct playable audio URL for Background Mode.
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId') ?? '';
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'videoId tidak valid' }, { status: 400 });
  }
  const ytUrl = `https://youtube.com/watch?v=${videoId}`;

  const url = (await getFromSavetube(videoId, ytUrl).catch(() => null))
    ?? (await getFromCobalt(ytUrl).catch(() => null))
    ?? (await getFromLexcode(ytUrl).catch(() => null));

  if (!url) return NextResponse.json({ error: 'Semua layanan ekstraksi audio gagal, coba lagu lain' }, { status: 503 });
  return NextResponse.json({ url });
}
