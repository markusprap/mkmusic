export async function getLyrics(trackTitle: string, artistName: string): Promise<string> {
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(trackTitle)}&artist_name=${encodeURIComponent(artistName)}`
    );
    if (!res.ok) {
      // Try search fallback
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${trackTitle} ${artistName}`)}`
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          return searchData[0].plainLyrics || searchData[0].syncedLyrics || 'Lirik tidak ditemukan.';
        }
      }
      return 'Lirik tidak ditemukan.';
    }
    const data = await res.json();
    return data.plainLyrics || data.syncedLyrics || 'Lirik tidak tersedia.';
  } catch (err) {
    return 'Lirik tidak dapat dimuat.';
  }
}
