import { NextRequest, NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

let ytmusic: YTMusic | null = null;
async function getClient(): Promise<YTMusic> {
  if (!ytmusic) { ytmusic = new YTMusic(); await ytmusic.initialize(); }
  return ytmusic;
}

interface SyncedLine { time: number; text: string }

function cleanTitle(t: string): string {
  return t
    .replace(/[\(\[\{].*?[\)\]\}]/gi, '')
    .replace(/ft\..*$/gi, '')
    .replace(/feat\..*$/gi, '')
    .replace(/-[^-]*official.*/gi, '')
    .trim();
}

function cleanArtist(a: string): string {
  return a.split(',')[0].split('&')[0].replace(/vevo/gi, '').trim();
}

function parseLrc(raw: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  for (const line of raw.split('\n')) {
    const match = line.match(/\[(\d+):(\d+)(?:\.(\d+))?\]\s*(.*)/);
    if (!match) continue;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const msStr = match[3] || '0';
    const ms = parseInt(msStr.padEnd(2, '0').slice(0, 2), 10) / 100;
    const time = min * 60 + sec + ms;
    const text = match[4]?.trim() || '♪';
    lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function GET(req: NextRequest) {
  const rawTitle = req.nextUrl.searchParams.get('title') ?? '';
  const rawArtist = req.nextUrl.searchParams.get('artist') ?? '';
  const videoId = req.nextUrl.searchParams.get('videoId') ?? '';

  const title = cleanTitle(rawTitle);
  const artist = cleanArtist(rawArtist);

  if (!title && !videoId) {
    return NextResponse.json({ synced: [], plain: '', isSynced: false });
  }

  // 1. Try LrcLib search first for high-precision synced LRC lyrics
  try {
    const q = `${title} ${artist}`.trim();
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
      headers: { 'Lrclib-Client': 'mkmusic/1.0' },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find best match with synced lyrics
        const bestSynced = results.find(r => r.syncedLyrics && r.syncedLyrics.trim().length > 0);
        if (bestSynced) {
          const synced = parseLrc(bestSynced.syncedLyrics);
          if (synced.length > 0) {
            return NextResponse.json({
              synced,
              plain: bestSynced.plainLyrics || synced.map(s => s.text).join('\n'),
              isSynced: true,
              source: 'lrclib-synced',
            });
          }
        }
        // Fallback to first result plain lyrics
        const bestPlain = results[0];
        if (bestPlain && bestPlain.plainLyrics) {
          return NextResponse.json({
            synced: [],
            plain: bestPlain.plainLyrics,
            isSynced: false,
            source: 'lrclib-plain',
          });
        }
      }
    }
  } catch (err) {
    console.error('LrcLib fetch error:', err);
  }

  // 2. Fallback to YTMusic getLyrics (returns clean plain lyrics, non-synced)
  if (videoId) {
    try {
      const client = await getClient();
      const raw = await client.getLyrics(videoId);
      if (raw && Array.isArray(raw) && raw.length > 0) {
        const plain = raw.join('\n');
        return NextResponse.json({
          synced: [],
          plain,
          isSynced: false,
          source: 'ytmusic',
        });
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({ synced: [], plain: '', isSynced: false });
}
