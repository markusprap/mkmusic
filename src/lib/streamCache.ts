// In-memory cache for Background Mode's resolved direct-audio URLs, keyed by
// video ID. Extraction is a multi-hop chain (Savetube -> Cobalt -> lexcode),
// so avoiding a redundant re-fetch for a track already resolved this session
// (replay, skip back) meaningfully cuts perceived delay.
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

async function fetchStreamUrl(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/stream?videoId=${videoId}`);
    const data = await res.json();
    if (data.url) { cache.set(videoId, data.url); return data.url; }
  } catch { /* extraction failed — caller just won't get a URL */ }
  return null;
}

export function resolveStreamUrl(videoId: string): Promise<string | null> {
  if (cache.has(videoId)) return Promise.resolve(cache.get(videoId)!);
  if (!pending.has(videoId)) {
    pending.set(videoId, fetchStreamUrl(videoId).finally(() => pending.delete(videoId)));
  }
  return pending.get(videoId)!;
}

// Fire-and-forget — warms the cache for a track the user hasn't clicked yet.
export function prefetchStreamUrl(videoId: string) {
  if (!cache.has(videoId)) resolveStreamUrl(videoId).catch(() => {});
}
