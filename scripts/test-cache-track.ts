// ponytail: minimal assert-based self-check for cacheTrack's merge-not-
// overwrite behavior (src/lib/store.ts) — a richer cached Track must survive
// a later, thinner write for the same id.
// Run: npx tsx scripts/test-cache-track.ts
import assert from 'node:assert';
import { cacheTrack, getTrack } from '../src/lib/store';

const rich = { id: 'abc', title: 'Real Title', artist: 'Real Artist', artistId: 'UC123', thumbnail: 'https://x/rich.jpg', duration: 200 };
const thin = { id: 'abc', title: 'Real Title', artist: 'Real Artist', artistId: undefined, thumbnail: '', duration: 0 };

cacheTrack(rich);
cacheTrack(thin); // simulates a later /api/upnext-style fetch missing artistId

const merged = getTrack('abc');
assert.strictEqual(merged?.artistId, 'UC123', 'artistId must survive a thinner overwrite');
assert.strictEqual(merged?.thumbnail, 'https://x/rich.jpg', 'thumbnail must survive an empty overwrite');
assert.strictEqual(merged?.duration, 200, 'duration must survive a zero overwrite');

// A genuinely richer later write should still be able to update fields.
cacheTrack({ id: 'abc', title: 'Updated Title', artist: 'Real Artist', artistId: 'UC456', thumbnail: 'https://x/new.jpg', duration: 210 });
const updated = getTrack('abc');
assert.strictEqual(updated?.artistId, 'UC456', 'a real new value must still be able to update the cache');
assert.strictEqual(updated?.title, 'Updated Title');

console.log('cacheTrack merge self-check: all assertions passed');
