# Implementation Plan: mkmusic Web Music Player

## Overview
mkmusic is a personal web music player with Spotify-inspired dark mode UI, YouTube audio search/streaming, Netflix-style multi-profile selection (Markus & Pacar), lyrics display, up-next queue, trending charts, mood/genre categories, and cloud-synced playlists per profile.

## Architecture Decisions
- **Framework**: Next.js 14 App Router + React + TypeScript + Vanilla CSS Modules (Fast, modern, Vercel ready).
- **Audio Extraction**: Invidious / Piped API / Youtube Search endpoint for reliable audio-only playback without ads.
- **State & Cloud Storage**: Supabase / Upstash KV API client with LocalStorage fallback for seamless profile & playlist sync.

## Task List

### Phase 1: Foundation & Project Setup
- [ ] Task 1: Initialize Next.js app structure, dark theme tokens, and project dependencies.
- [ ] Task 2: Implement Profile Switcher (Netflix-style "Who's listening?") & profile state management.

### Checkpoint: Foundation
- [ ] App runs locally, allows profile selection, and persists selected profile in local state.

### Phase 2: Core Audio Engine & Search
- [ ] Task 3: Implement YouTube Search & Audio Stream extraction service (`src/lib/youtube.ts` & API proxy).
- [ ] Task 4: Build Main Music Player Layout & Player Bar (Play/Pause, Seek, Volume, Shuffle, Repeat).
- [ ] Task 5: Implement Search View & Track Grid with instant play.

### Checkpoint: Core Audio Engine
- [ ] User can search tracks, click play, and hear audio streaming seamlessly without ads.

### Phase 3: Playlist, Queue & Features (Spotify/YTMusic Features)
- [ ] Task 6: Implement Up Next Queue panel (`src/components/Queue.tsx`) with re-ordering and autoplay.
- [ ] Task 7: Implement Lyrics Viewer (`src/components/Lyrics.tsx`) fetching track lyrics.
- [ ] Task 8: Implement Trending Chart & Mood/Genre discovery pages (`src/components/Discover.tsx`).
- [ ] Task 9: Implement Playlist Manager (Create playlist, add/remove tracks, profile-specific sync via Supabase / KV / LocalStorage).

### Checkpoint: Feature Completeness
- [ ] Profiles have independent playlists, lyrics work, trending charts display tracks, and queue functions properly.

### Phase 4: Polish & Deployment Verification
- [ ] Task 10: Run full build check (`npm run build`), polish responsive UI, and verify Vercel deployment configuration.

### Phase 5: Spotify Accuracy Pass + Netflix-style PIN Profiles (Revision 2)
- [ ] Task 11: Correct dark theme color tokens to real Spotify hex values in `globals.css`.
- [ ] Task 12: Build `src/lib/pin.ts` (scrypt hash/verify, server-only, `node:crypto`).
- [ ] Task 13: Build `/api/profiles` (GET public list, POST create+hash), `/api/profiles/[id]` (PUT, DELETE — PIN-gated), `/api/profiles/[id]/unlock` (POST pin check → full profile).
- [ ] Task 14: Rework `ProfileSelect.tsx` — PIN+confirm on create, PIN entry on select (4-box input), 5-profile cap, manage/delete mode.
- [ ] Task 15: Update `store.ts`/`page.tsx` to use the new API routes instead of direct client-side Supabase calls for profiles.
- [ ] Task 16: Write `docs/supabase-migration.sql` (adds `pin_hash`/`avatar` columns, deletes existing profile rows) for the user to run once in the Supabase SQL Editor.

### Checkpoint: PIN Profiles
- [ ] Creating a profile requires setting a 4-digit PIN; selecting any profile requires re-entering it; wrong PIN is rejected; PIN never appears in any network response visible in devtools.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube / Invidious stream rate-limiting | High | Fall back across multiple public Invidious/Piped API instances |
| No active internet for cloud DB | Medium | Graceful fallback to browser `localStorage` for offline playlist caching |

## Open Questions
- None.
