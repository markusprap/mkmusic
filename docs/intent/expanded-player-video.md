# Intent: Video playback in the expanded player (not started)

## Outcome
Add real YouTube video playback for tracks that have an associated video, surfaced through the expanded/now-playing view:
- **Mobile** (expanded player): add a "Video" tab alongside the existing tabs (Antrian/Lirik) — opening it plays the track's YouTube video instead of just audio+static art.
- **Desktop**: clicking the now-playing track title in the bottom player bar (`mkmusic` bar shown when nothing/something is playing) expands into a view. First thing shown is a Spotify-style rotating vinyl-record visual with the track's album art embedded in the center. A "Video" tab sits alongside it — opening it swaps to the actual YouTube video for that track.

## Why now
Follows naturally from building "Video musik untuk Anda" (a Home row of video-flavored search results) — the user wants tracks that genuinely have a video counterpart to be watchable, not just playable as audio.

## Note: revises the original project scope
`docs/intent/mkmusic_intent.md` (the original founding intent) lists "Heavy YouTube video playback (audio-focused)" under **Out of Scope**. This new ask is a deliberate scope change the user is choosing to make now, not an oversight — flagging it here so it's visible when this gets picked up, rather than silently contradicting the original doc.

## Status
**Done — shipped in Phase 13** (`tasks/plan.md`/`tasks/todo.md`, Tasks 55-60).
Answers to the open questions below, for the record:
- "Has a video?" turned out to be moot — every track's `videoId` already is
  a real YouTube video, so the Video tab always plays the current track's
  own `videoId`, no detection needed.
- The vinyl is CSS/SVG-drawn (`src/components/VinylArt.tsx`), no image asset.
- Video plays via a plain `youtube.com/embed/{videoId}` iframe.
- Switching tabs is visual-only — the existing custom audio player keeps
  driving playback regardless of which tab is selected, so queue/background-
  mode/stream-caching are untouched.
