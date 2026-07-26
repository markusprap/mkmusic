# Task List: mkmusic

## Phase 1: Foundation & Project Setup
- [x] **Task 1: Initialize Next.js project & dark theme system**
  - Acceptance: Next.js App Router setup with Spotify dark theme tokens (CSS variables for dark background `#0f0f13`, accent green `#1db954`, card dark `#16161e`).
  - Verify: `npm run dev` starts without errors and renders dark background.
  - Files: `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [x] **Task 2: Implement Netflix-style Profile Switcher**
  - Acceptance: Modal/Screen allowing user to select or create a profile (e.g. Markus, Pacar) and store active profile.
  - Verify: Selecting a profile updates active user state and shows main player dashboard.
  - Files: `src/components/ProfileSelect.tsx`, `src/lib/store.ts`

## Phase 2: Core Audio Engine & Search
- [x] **Task 3: Implement YouTube Search & Audio Stream Extractor**
  - Acceptance: API module that queries YouTube/Invidious and returns track title, artist, thumbnail, duration, and direct audio stream URL.
  - Verify: Search function returns array of track objects with valid stream URLs.
  - Files: `src/lib/youtube.ts`, `src/app/api/search/route.ts`, `src/app/api/stream/route.ts`

- [x] **Task 4: Build Main Music Player Bar & Controls**
  - Acceptance: Fixed bottom bar displaying current track info, album art, play/pause toggle, seek bar, volume control, shuffle, and repeat.
  - Verify: Audio plays, pause works, progress updates in real time, and volume changes correctly.
  - Files: `src/components/Player.tsx`, `src/styles/player.module.css`

- [x] **Task 5: Implement Track Search View & Grid**
  - Acceptance: Search bar input that fetches search results live and displays them in a grid/list; clicking a track plays it.
  - Verify: Typing "Coldplay" shows track results; clicking a result immediately loads and plays audio.
  - Files: `src/components/Search.tsx`, `src/app/page.tsx`

## Phase 3: Playlist, Queue & Features
- [x] **Task 6: Implement Up Next Queue Panel**
  - Acceptance: Queue panel showing upcoming tracks, with ability to add tracks, skip, and reorder.
  - Verify: Adding 3 songs to queue plays them sequentially automatically when the current song ends.
  - Files: `src/components/Queue.tsx`

- [x] **Task 7: Implement Lyrics Viewer**
  - Acceptance: Lyrics panel that fetches track lyrics by title/artist and displays synchronized or scrollable text.
  - Verify: Clicking "Lyrics" button opens lyrics side sheet with text of current song.
  - Files: `src/components/Lyrics.tsx`, `src/lib/lyrics.ts`

- [x] **Task 8: Implement Trending Chart & Mood/Genre Discovery**
  - Acceptance: Homepage sections showing Top Trending tracks, and clickable Mood/Genre pills (Pop, Rock, Chill, Focus, Workout).
  - Verify: Clicking "Chill" filter searches and populates chill track recommendations.
  - Files: `src/components/Discover.tsx`

- [x] **Task 9: Implement Playlist Manager (Cloud Sync & LocalStorage)**
  - Acceptance: Users can create custom playlists, add/remove tracks, and save favorite songs per profile, synced with cloud storage or local storage.
  - Verify: Switching profile from "Markus" to "Pacar" shows Pacar's distinct playlists and liked songs.
  - Files: `src/components/Playlists.tsx`, `src/lib/store.ts`

## Phase 5: Spotify Accuracy Pass + Netflix-style PIN Profiles
- [ ] **Task 11: Correct color tokens**
  - Acceptance: `--bg-base` #121212, `--bg-card` #181818, `--bg-card-hv` #282828, player bar #000.
  - Files: `src/app/globals.css`
- [ ] **Task 12: PIN hashing utility**
  - Acceptance: `hashPin(pin)` returns `salt:hash`; `verifyPin(pin, stored)` round-trips correctly and rejects wrong PIN; never imported by a `'use client'` file.
  - Files: `src/lib/pin.ts`
- [ ] **Task 13: Profile API routes**
  - Acceptance: list endpoint never includes `pin_hash`; create hashes before insert; unlock verifies and returns full profile only on match; delete/update require correct PIN.
  - Files: `src/app/api/profiles/route.ts`, `src/app/api/profiles/[id]/route.ts`, `src/app/api/profiles/[id]/unlock/route.ts`
- [ ] **Task 14: Netflix-style ProfileSelect UI**
  - Acceptance: create flow requires PIN + confirm PIN (4 digits, must match); selecting a profile opens a 4-box PIN entry, wrong PIN shakes and clears; "Kelola Profil" pencil toggles edit/delete mode; capped at 5 profiles.
  - Files: `src/components/ProfileSelect.tsx`, `src/app/globals.css`
- [ ] **Task 15: Wire client to new API**
  - Acceptance: no direct `supabase.from('profiles')` calls remain in any client component; `npm run build` passes.
  - Files: `src/lib/store.ts`, `src/app/page.tsx`
- [ ] **Task 16: Supabase migration script**
  - Acceptance: single SQL file adds needed columns and clears the table; user runs once manually.
  - Files: `docs/supabase-migration.sql`

## Phase 4: Polish & Build Verification
- [x] **Task 10: Run Build & Deployment Verification**
  - Acceptance: Production build compiles cleanly with zero TypeScript or linting errors, ready for Vercel deployment.
  - Verify: `npm run build` succeeds cleanly.
  - Files: `package.json`
