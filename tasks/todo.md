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

## Phase 8: Desktop scroll-row navigation arrows
- [x] **Task 25: `useHScroll` hook**
  - Acceptance: returns `{ ref, canPrev, canNext, scrollPrev, scrollNext }`. `canPrev`/`canNext` track the row's actual scroll position (via a `scroll` listener + resize listener on the ref'd element), not a fixed guess. `scrollPrev`/`scrollNext` call `scrollBy({ left: ±clientWidth*0.85, behavior: 'smooth' })`.
  - Verify: dragging/scrolling a row updates `canPrev`/`canNext` without a click.
  - Files: `src/components/Home.tsx`

- [x] **Task 26: Prev/Next button pair, reusing existing styling**
  - Acceptance: renders two buttons using the existing `.topbar-nav-btn` class (already styled circular + disabled state in `globals.css`, currently only used by `TopBar.tsx`'s back/forward nav) — no new CSS class for the button look itself.
  - Files: `src/components/Home.tsx`

- [x] **Task 27: Wire into all three scroll surfaces**
  - Acceptance: Prev/Next appears next to the title in — (a) the `.quick-grid` header (Pilihan Cepat, alongside the existing "Putar Semua" button), (b) `TrackRow` (covers Baru Diputar/Untuk Kamu/Favorit Lama), (c) a new `HomeSectionRow` component extracted from the current inline `sections.map(...)` block (covers every realSections/extraSections row) — each row instance owns its own `useHScroll()` call, not shared state.
  - Verify: clicking Next/Prev on one row never affects another row's scroll position.
  - Files: `src/components/Home.tsx`

- [x] **Task 28: Hide on mobile**
  - Acceptance: arrow pair is not rendered/visible under the existing `@media (max-width:768px)` breakpoint; touch-swipe scrolling still works there (unchanged, since it never depended on these buttons).
  - Files: `src/app/globals.css`

### Checkpoint: Scroll arrows
- [x] On desktop, every horizontally-scrolling Home section shows a Previous/Next pair next to its title, correctly disabled at each end, scrolling smoothly ~1 viewport-width per click. On mobile width, no arrows render and touch-swipe still scrolls the rows. (Fixed a ref-timing bug found during manual testing: `useHScroll` used to measure the row on mount, but rows that start empty/skeleton don't have the real element yet — switched to a state-based ref callback so measuring re-runs when the real element attaches.)

## Phase 9: "Baru dari {Artist}" + "Playlist trending komunitas"
- [x] **Task 29: Favorite-artist ranking (groundwork, already shipped)**
  - Acceptance: `favoriteArtistIds` in `src/components/Home.tsx`'s `fetchHome` ranks artists by aggregated `playCounts` (summed across that artist's tracks); "Mirip dengan {Artist}" already consumes `favoriteArtistIds[1]` so it stays distinct from whichever artist "Baru dari {Artist}" uses for the #1 slot.
  - Files: `src/components/Home.tsx`

- [x] **Task 30: "Baru dari {Artist}" data — fetch artist #1's latest release**
  - Description: Add a second `/api/artist?id=<favoriteArtistIds[0]>` fetch to the existing `Promise.allSettled` batch in `fetchHome` (parallel to the one "Mirip dengan" already uses for artist #2). From the response's `topSingles`/`topAlbums`, pick whichever of `topSingles[0]`/`topAlbums[0]` has the higher `year` (ties favor the single) — confirmed via a live `/api/artist` check that `topSingles` is already sorted newest-first by year, `topAlbums` is not.
  - Acceptance criteria:
    - [ ] No fetch/section when `favoriteArtistIds[0]` is missing (new profile, no play history) — falls back silently, no crash, no empty card.
    - [ ] Picks the correct one of single-vs-album by year; year is never fabricated past what the API returns (can be `null`).
  - Verification: `npx tsc --noEmit`; manually confirm in dev tools that the new fetch appears in the network tab only when a favorite artist exists.
  - Dependencies: None (reuses the existing `/api/artist` route as-is).
  - Files: `src/components/Home.tsx`
  - Estimated scope: Small (1 file)

- [x] **Task 31: "Baru dari {Artist}" card component**
  - Description: One-off card (not part of the repeating scroll-row system — a single card, no arrows needed): small artist avatar + "Baru dari {Artist}" label above, then a wide card below (title + "Single • {year}" or "Album • {year}" + circular play button on the left, cover art filling the right side), matching the reference screenshot layout.
  - Acceptance criteria:
    - [ ] Clicking play queues/plays that release the same way other cards do (reuse `onPlay`/`cacheTrack` patterns already in `Home.tsx`, not a new playback path).
    - [ ] Section doesn't render at all when Task 30 found nothing (no broken/empty card ever shown).
  - Verification: `npx tsc --noEmit`; manual check that clicking play actually starts playback.
  - Dependencies: Task 30.
  - Files: `src/components/Home.tsx`
  - Estimated scope: Small (1 file)

### Checkpoint: Baru dari Artist
- [ ] A profile with real play history sees a "Baru dari {favorite artist #1}" card showing that artist's actual latest single/album with a real (year-only) date, distinct from whichever artist "Mirip dengan" is showing; a profile with no play history simply doesn't see this card (no crash, no empty state).

- [x] **Task 32: `/api/playlist` route (new)**
  - Description: New route wrapping `ytmusic-api`'s `getPlaylistVideos(id)` (confirmed via the library's type defs: `getPlaylist()` explicitly excludes tracks — "all possible information except the tracks" — so `getPlaylistVideos()` is the one that returns the actual video list needed for thumbnails). Returns `{ count: number, thumbnails: string[] }` — `count` is `videos.length` (the method returns the full list, so length is the true count, no separate `getPlaylist()` call needed), `thumbnails` is the first 4 videos' thumbnail URLs.
  - Acceptance criteria:
    - [x] Follows the existing route conventions in `src/app/api/artist/route.ts`/`src/app/api/album/route.ts` (uses `getYTMusicClient()`, try/catch returning a typed error JSON on failure, not a 500 crash).
    - [x] Response shape matches what the new component (Task 34) expects.
  - Verification: `curl "localhost:3000/api/playlist?id=<a real playlist id>"` returns `count` + up to 4 `thumbnails`. Verified live against a real playlist: `{"count":50,"thumbnails":[...4 urls...]}`.
  - Dependencies: None.
  - Files: `src/app/api/playlist/route.ts` (new)
  - Estimated scope: Small (1 file)

- [x] **Task 33: Community-playlist collage fetching in `fetchHome`**
  - Description: Take the first 20 playlists already available for free in `chartRes.value.playlists` (unchanged from the current "Dari Komunitas" source), then fetch `/api/playlist?id=` for each one **after** the main sections are already set (`setLoadingHome(false)` already called) — this is progressive enrichment, not blocking the initial paint. Store results in a new `communityPlaylists` state.
  - Acceptance criteria:
    - [x] Initial home paint is not delayed by these extra requests (row renders immediately with single-thumbnail fallback, upgrades to collage as each `/api/playlist` call resolves via a follow-up `setCommunityPlaylists` — fired but not awaited inside `fetchHome`).
    - [x] A failed `/api/playlist` call for one playlist doesn't block or blank the others (`Promise.allSettled`, per-item fallback to the single flat thumbnail already known from search).
  - Verification: `npx tsc --noEmit`; manual check that Home's main content appears before the community row's collages finish loading (throttle network in dev tools if needed).
  - Dependencies: Task 32.
  - Files: `src/components/Home.tsx`
  - Estimated scope: Medium (1 file, but real async-sequencing logic)

- [x] **Task 34: "Playlist trending komunitas" card + row**
  - Description: Replace the current "Dari Komunitas" section (single flat thumbnail, built from the free `.playlists` field) with a dedicated row component rendering a real 2x2 photo collage (the 4 thumbnails from Task 33) plus the real song count in the subtitle. Not routed through the generic `HomeSectionRow`/`HomeItem` path (those assume one image per card) — its own small component, reusing the `useHScroll` hook + `ScrollArrows` for consistency with every other row.
  - Acceptance criteria:
    - [x] Section title matches the reference: "Playlist trending komunitas".
    - [x] Falls back to the single flat thumbnail (today's behavior) for any playlist whose `/api/playlist` call hasn't resolved yet or failed — never a broken/blank card.
  - Verification: `npx tsc --noEmit`; visual check the collage renders as 4 quadrants, not stretched/distorted.
  - Dependencies: Task 33.
  - Files: `src/components/Home.tsx`
  - Estimated scope: Small (1 file)

### Checkpoint: Playlist trending komunitas
- [x] The community-playlist row shows real 2x2 photo collages and accurate song counts, degrading gracefully to the old single-thumbnail look for any playlist whose extra fetch is slow/fails, and never delays the rest of the Home page from appearing.

## Phase 9 done criteria
- [x] Both sections shipped, typecheck clean, ponytail-review clean (one finding along the way — a reinvented play-button style — fixed by reusing the existing `.play-btn` class), no regression to existing sections/rows.

## Phase 10: Real in-app navigation history (Back/Forward)
Bug report: `TopBar.tsx`'s Back arrow called raw browser `history.back()`, which escaped to the login page because this SPA never pushes real browser history for its own tab/detail-view navigation. User chose the full fix (real in-app history) over a minimal "just close the overlay" patch.

- [x] **Task 35: Navigation-history state model**
  - Description: Add `interface NavLocation { tab: Tab; searchQuery: string; detail: { type: 'artist' | 'album'; id: string } | null }` plus `navHistory: NavLocation[]` / `navIndex: number` state in `src/app/page.tsx`. Add `pushNav(partial)` (truncate anything past `navIndex`, append a new entry, advance the pointer), `replaceNav(partial)` (mutate the entry at `navIndex` in place), `goBack`/`goForward` (move the pointer, clamped), `canGoBack`/`canGoForward` (derived booleans). Remove the existing `activeTab`/`searchQuery`/`detailView` `useState` calls; replace with `const { tab: activeTab, searchQuery, detail: detailView } = navHistory[navIndex]` (or equivalent) so every existing reader of those three names elsewhere in the file needs zero changes.
  - Acceptance criteria:
    - [ ] `pushNav` after a `goBack` correctly discards the old "forward" entries (standard browser-history behavior, not just appending).
    - [ ] No other file changes required for this task alone (pure internal refactor of `page.tsx`'s state shape).
  - Verification: `npx tsc --noEmit`.
  - Dependencies: None.
  - Files: `src/app/page.tsx`
  - Estimated scope: Small (1 file)

- [x] **Task 36: Rewrite the 8 call sites against the new model**
  - Description: `openArtist`/`openAlbum` → `pushNav({ detail: {...} })`. `handleTabChange` → `pushNav({ tab, detail: null })`. `handleSearchQuery` (wired to live keystroke-by-keystroke typing) → `replaceNav({ searchQuery: q })`, except the very first keystroke that moves onto the search tab, which needs `pushNav({ tab: 'search', searchQuery: q })` instead (so arriving at Search is itself one history step, not zero). The two `onSearch={q => {...}}` closures (Home mood chips, Discover categories) and Search's `onCategoryClick` → `pushNav({ tab: 'search', searchQuery: q })` (explicit one-shot navigation, always a new entry). Both `onBack` props passed to `<Artist>`/`<Album>` → `goBack` (function identity, no wrapper needed since the prop signature is already `() => void`).
  - Acceptance criteria:
    - [ ] Typing multiple characters in the search box produces exactly one new history entry for that search session, not one per keystroke.
    - [ ] Clicking a mood chip from Home, a category from Discover, or a category tile from within Search each produce exactly one new history entry.
    - [ ] Opening an artist from within another artist's page (related-artist click) pushes correctly (back from B returns to A, back again returns to whatever was active before A).
  - Verification: `npx tsc --noEmit`; manual click-through matching the acceptance criteria above.
  - Dependencies: Task 35.
  - Files: `src/app/page.tsx`
  - Estimated scope: Small (1 file, but several call sites — go one at a time)

- [x] **Task 37: `TopBar.tsx` wired to real in-app history**
  - Description: Replace the `onClick={() => history.back()}` / `history.forward()` handlers with new `onBack`/`onForward` props; add `disabled={!canGoBack}`/`disabled={!canGoForward}` using the existing `.topbar-nav-btn:disabled` style (already used elsewhere, no new CSS). Wire the four new props (`onBack`, `onForward`, `canGoBack`, `canGoForward`) from `page.tsx`'s `<TopBar>` call.
  - Acceptance criteria:
    - [ ] Back is visibly disabled (existing `:disabled` opacity/cursor style) when `navIndex === 0`; Forward disabled when at the end of history.
    - [ ] Neither button ever calls a real browser `history` API again.
  - Verification: `npx tsc --noEmit`; manual check both buttons' disabled states at the start of a session and after using Back fully.
  - Dependencies: Task 35, Task 36 (needs `canGoBack`/`canGoForward`/`goBack`/`goForward` to exist and be correct).
  - Files: `src/components/TopBar.tsx`, `src/app/page.tsx`
  - Estimated scope: Small (2 files)

- [x] **Task 38: Reset history on profile switch**
  - Description: Inside `handleProfileSelect` (fires on both first login and switching profiles), reset `navHistory`/`navIndex` back to a fresh single `{ tab: 'home', searchQuery: '', detail: null }` entry — otherwise Back could walk into a previous profile's browsing state after a switch.
  - Acceptance criteria:
    - [ ] Switching from Profile A (mid-navigation, several history entries deep) to Profile B lands on Home with Back disabled, not on any of Profile A's history entries.
  - Verification: `npx tsc --noEmit`; manual profile-switch check.
  - Dependencies: Task 35.
  - Files: `src/app/page.tsx`
  - Estimated scope: Small (1 file)

### Checkpoint: Navigation history
- [x] Reproduces the reported fix end-to-end: open "Baru dari {Artist}" → TopBar Back → lands on the tab that was active before (never the login page) → TopBar Forward → back on the album. Tab-switch history retraces correctly. Search typing doesn't flood history. Back/Forward correctly disabled at each end. Profile switch resets history. (Typecheck-verified; manual click-through still pending from the user, needs a live login session.)

## Phase 10 done criteria
- [x] All four tasks shipped, typecheck clean, ponytail-review clean.

## Phase 11: "Playlist unggulan untuk Anda" + "Rekomendasi harian Anda"
Two more Home sections confirmed via interview-me against the same reference screenshot pass. Mid-interview the user dropped the poster-style overlay idea for "Playlist unggulan" in favor of the existing plain card style, which simplified that half to almost nothing.

- [x] **Task 39: "Playlist unggulan untuk Anda" section**
  - Description: Push a new `extraSections` entry titled "Playlist unggulan untuk Anda" sourced from `dangdutRes.value.playlists` — this field has been fetched every load (same `/api/search` call built for the "Dangdut" track section) but never read, exactly like `chartRes.value.playlists` was sitting unused before "Playlist trending komunitas" reused it. Renders through the existing `HomeSectionRow` component unchanged.
  - Acceptance criteria:
    - [x] No new `fetch` call anywhere for this task.
    - [x] Section only appears when `dangdutRes` resolved with a non-empty `playlists` array (same guard pattern as every other `extraSections.push` in this file).
  - Verification: `npx tsc --noEmit` clean. Verified live: `/api/search?q=dangdut+koplo` returns 20 playlists.
  - Dependencies: None.
  - Files: `src/components/Home.tsx`
  - Estimated scope: XS (a few lines, 1 file)

- [x] **Task 40: "Rekomendasi harian Anda" data slice**
  - Description: Add a `dailyPicks` derivation in `fetchHome` — `chartRes.value.tracks.slice(10, 20)` (the first 10 already went to "Chart Global"/the Pilihan Cepat "pilihan" bucket; this range has never been read). New `dailyPicks` state, set alongside the other track-pool state setters.
  - Acceptance criteria:
    - [x] No new `fetch` call.
    - [x] Empty gracefully (no section, not a broken one) if `chartRes.value.tracks.length <= 10`.
  - Verification: `npx tsc --noEmit` clean. Verified live: chart search returns 40 tracks, well past index 20.
  - Dependencies: None.
  - Files: `src/components/Home.tsx`
  - Estimated scope: XS (1 file)

- [x] **Task 41: `HeroTrackRow` component**
  - Description: New component for "Rekomendasi harian Anda" — large full-bleed card per track (background image fills the card), title + artist overlaid near the top over a `linear-gradient` dark fade (for legibility regardless of the image's own colors — no fabricated view-count text, no video description, both confirmed out of scope since `ytmusic-api` has neither). Horizontally scrollable using the existing `useHScroll` hook + `ScrollArrows` (same as every other row this session), with a "Putar Semua" button in the header next to the title (same pattern as Pilihan Cepat's header).
  - Acceptance criteria:
    - [x] Text stays legible over a light-colored thumbnail (the gradient, not the image, is what guarantees contrast — don't rely on the image being dark).
    - [x] Clicking a card plays that track with the `dailyPicks` pool as the queue (same `onPlay(t, pool)` pattern as every other row).
    - [x] "Putar Semua" plays from the first item with the full pool queued.
  - Verification: `npx tsc --noEmit` clean; ponytail-review clean.
  - Dependencies: Task 40.
  - Files: `src/components/Home.tsx`, `src/app/globals.css`
  - Estimated scope: Small (1 file)

### Checkpoint: Playlist unggulan + Rekomendasi harian
- [x] Both sections appear on Home with zero new network requests total; hero cards scroll correctly (reusing `useHScroll`), text legible via gradient overlay, "Putar Semua" wired.

## Phase 11 done criteria
- [x] All three tasks shipped, typecheck clean, ponytail-review clean, no regression to existing sections.

## Phase 12: "Dari komunitas" redesign + "Video musik untuk Anda"
Confirmed via interview-me. Note: a separate, bigger feature (vinyl-record now-playing view + Video tab playing the real YouTube video) came up during this interview and was deliberately parked, not folded in here — recorded at `docs/intent/expanded-player-video.md` for its own interview-me pass later.

- [x] **Task 42: `/api/playlist` returns 3 preview tracks**
  - Description: Add `tracks: videos.slice(0,3).map(v => ({ id: v.videoId, title: v.name, artist: v.artist?.name ?? '', thumbnail: v.thumbnails?.[0]?.url ?? '' }))` to the existing response, reading more fields off the `getPlaylistVideos()` call already made for `count`/`thumbnails` — no new request.
  - Acceptance criteria:
    - [ ] Response includes `tracks` alongside the existing `count`/`thumbnails` fields.
    - [ ] No second network/API call added.
  - Verification: `curl "localhost:3000/api/playlist?id=<real playlist id>"`, confirm `tracks` has up to 3 real track objects.
  - Dependencies: None.
  - Files: `src/app/api/playlist/route.ts`
  - Estimated scope: XS (1 file)

- [x] **Task 43: `CommunityPlaylist` type + state carries `tracks`**
  - Description: Add `tracks: Track[]` to the `CommunityPlaylist` interface in `Home.tsx`; update the progressive-enrichment `.then(results => setCommunityPlaylists(...))` block (built in Phase 9) to also pick up `r.value.tracks` from the now-richer `/api/playlist` response, defaulting to `[]` before that resolves.
  - Acceptance criteria:
    - [ ] Cards render fine (empty preview list, not broken) before the enrichment fetch resolves.
  - Verification: `npx tsc --noEmit`.
  - Dependencies: Task 42.
  - Files: `src/components/Home.tsx`
  - Estimated scope: XS (1 file)

- [x] **Task 44: `CommunityPlaylistRow` expanded card**
  - Description: Redesign the card markup to match the reference: collage (unchanged from Phase 9) + title + creator + "{count} lagu" (no views/watch-count anywhere — not available in the data) + a 3-row track preview underneath (thumbnail + title + artist + its own `TrackMenu`, reusing the same `card-menu`/`TrackMenu` pattern as every other track row) + one Play button that calls `onPlay(tracks[0], tracks)` to queue the 3 preview tracks. The reference's cast/save icon buttons are dropped — no corresponding feature exists in this app.
  - Acceptance criteria:
    - [ ] Card doesn't render a broken/empty preview list for a playlist whose enrichment hasn't resolved yet (Task 43's default `[]` handles this — Play button hidden or disabled when `tracks.length === 0`).
    - [ ] Each preview track's own `TrackMenu` works independently (add to queue/playlist) without triggering the outer Play button.
  - Verification: `npx tsc --noEmit`; visual check the card matches the reference's shape (still fine if pixel-different, just structurally: collage → title/creator/count → 3-track list → play button).
  - Dependencies: Task 43.
  - Files: `src/components/Home.tsx`
  - Estimated scope: Small (1 file)

### Checkpoint: Dari komunitas redesign
- [ ] "Dari komunitas" row shows the expanded card layout end-to-end: collage, title/creator/count (no fabricated stats), a working 3-track preview list, and a Play button that queues those 3 tracks.

- [x] **Task 45: `searchYouTubeVideos()` in `src/lib/youtube.ts`**
  - Description: New exported function wrapping `client.searchVideos(query)` alone — unlike `searchYouTubeTracks()`, which merges `searchSongs()` + `searchVideos()` into one blended pool, this keeps results purely video-sourced so their thumbnails stay genuinely widescreen/video-still rather than Music-catalog square art.
  - Acceptance criteria:
    - [ ] Same `Track`-shaped return type as `searchYouTubeTracks()` for drop-in compatibility with existing rendering code.
  - Verification: quick `curl` against the new route (Task 46) once wired.
  - Dependencies: None.
  - Files: `src/lib/youtube.ts`
  - Estimated scope: XS (1 file)

- [x] **Task 46: `/api/videos?q=` route**
  - Description: New route wrapping Task 45, following the exact conventions of every other route in `src/app/api/*` (`getYTMusicClient()`, try/catch → typed error JSON, not a 500 crash).
  - Acceptance criteria:
    - [ ] Matches the existing route file/response-shape conventions (see `src/app/api/search/route.ts` for the closest sibling).
  - Verification: `curl "localhost:3000/api/videos?q=<query>"` returns real widescreen-thumbnail results.
  - Dependencies: Task 45.
  - Files: `src/app/api/videos/route.ts` (new)
  - Estimated scope: XS (1 file)

- [x] **Task 47: Wire the video fetch into `fetchHome`**
  - Description: Add one more entry to the existing `Promise.allSettled` batch (a generic query like "official music video 2026" or similar, reused verbatim style from the chart/dangdut generic queries already there) + new `videoPicks` state, populated the same way as every other track-pool state setter.
  - Acceptance criteria:
    - [ ] Follows the same `status === 'fulfilled'` narrowing pattern as every other entry in this batch.
  - Verification: `npx tsc --noEmit`.
  - Dependencies: Task 46.
  - Files: `src/components/Home.tsx`
  - Estimated scope: XS (1 file)

- [x] **Task 48: Render "Video musik untuk Anda" via `TrackRow`'s new `wide` prop**
  - Description: Add an optional `wide?: boolean` prop to the existing `TrackRow` component — when true, applies a `.card-img-wrap.wide{aspect-ratio:16/9}` modifier class instead of the default square aspect ratio. The only actual visual difference this section needs from every other `TrackRow` usage is thumbnail shape, so extending the existing component (not building a new sibling one) is the smaller diff.
  - Acceptance criteria:
    - [ ] Every existing `TrackRow` usage (Baru Diputar, Untuk Kamu, Favorit Lama) is visually unchanged (prop defaults to square/off).
    - [ ] "Video musik untuk Anda" row renders wide 16:9 thumbnails.
  - Verification: `npx tsc --noEmit`; visual check both the new wide row and an existing square row still look right.
  - Dependencies: Task 47.
  - Files: `src/components/Home.tsx`, `src/app/globals.css`
  - Estimated scope: Small (2 files)

### Checkpoint: Video musik untuk Anda
- [ ] Section shows real, distinctly-video (not Music-catalog) results with wide thumbnails, scrolls, "Putar Semua" works, existing `TrackRow` usages elsewhere are unaffected.

## Phase 12 done criteria
- [x] All seven tasks shipped, typecheck clean, ponytail-review clean, no regression to existing sections/rows.

## Phase 13: Auth flow order, Room sync bug, Expanded player (vinyl+video), Queue reorder, Image fallback

### 13A — Welcome-after-login + registration copy
- [x] **Task 49: Reorder Splash/Welcome/Login gating in `src/app/page.tsx`**
  - Description: Swap the order of the two early-return checks (currently `showWelcome` before `hasSession`) so `Login` renders first for a signed-out visitor; `Welcome` only ever shows post-login.
  - Acceptance criteria:
    - [ ] Signed-out + first-ever visit: Login shows immediately after Splash, never Welcome.
    - [ ] First login on a fresh browser: Welcome shows once immediately after login succeeds, then never again (existing `mkmusic_welcomed` localStorage flag unchanged).
  - Verification: `npx tsc --noEmit`; manual click-through of both paths.
  - Dependencies: None.
  - Files: `src/app/page.tsx`
  - Estimated scope: XS (1 file)

- [ ] **Task 50: Verify registration success copy (no code change expected)**
  - Description: `src/components/Login.tsx:97-112` already signs the new session back out and shows "Akun berhasil dibuat, silakan masuk" before switching to the sign-in form — confirm this is actually what the user saw fail, since the code already does what item 3 asked for.
  - Acceptance criteria:
    - [ ] Live signup test shows the success message before reaching a logged-in screen, OR a genuinely different bug is identified and reported back.
  - Verification: Manual signup against the real Supabase project.
  - Dependencies: None.
  - Files: None expected.
  - Estimated scope: XS (verification only)

### Checkpoint 13A
- [ ] Login always precedes Welcome for signed-out users; registration success messaging confirmed correct.

### 13B — Room sync bug: diagnostics + resilient fix
- [x] **Task 51: Add Realtime diagnostics logging**
  - Description: `.subscribe((status) => console.log('[room] channel status:', status))` on the channel in `src/app/page.tsx`, plus a log inside the `postgres_changes` UPDATE callback confirming payloads arrive.
  - Acceptance criteria:
    - [ ] Console shows `SUBSCRIBED` (or the real failure status) when a room is active.
    - [ ] Console logs each incoming UPDATE payload during a live two-profile test.
  - Verification: Manual — open two profiles in the same room, watch console on both.
  - Dependencies: None.
  - Files: `src/app/page.tsx`
  - Estimated scope: XS (1 file)

- [x] **Task 52: Confirm Realtime publication includes `rooms`/`room_members` (dashboard check, user-side)**
  - Resolved: user ran `alter publication supabase_realtime add table rooms;` in the SQL editor and got `ERROR: 42710: relation "rooms" is already member of publication "supabase_realtime"` — confirms the publication was already correctly configured. **Ruled out as the root cause.** The bug is elsewhere (RLS/auth on the Realtime websocket, or app-side state logic) — Task 53's polling fallback and Task 54's echo-guard fix proceed regardless, and Task 51's logging (already shipped) is what will pin down the real cause on the next live two-profile test.

- [x] **Task 53: Polling fallback for room state**
  - Description: While `activeRoom` is set, poll `fetchRoomRemote(activeRoom.id)` on a ~4s interval and run the result through the existing `applyRoomSnapshot` (already safe against echoing pure-local state, so this layers on top of Realtime rather than replacing it).
  - Acceptance criteria:
    - [ ] With Realtime artificially disabled (e.g. throttled/blocked in devtools), a room-mate's play/pause/next still reaches the other profile within one polling interval.
    - [ ] No duplicate/conflicting updates when both Realtime and polling deliver the same change (existing no-op guard in `applyRoomSnapshot` handles this).
  - Verification: `npx tsc --noEmit`; manual two-profile test, including one with Realtime blocked.
  - Dependencies: None (independent of Task 51/52).
  - Files: `src/app/page.tsx`
  - Estimated scope: Small (1 file)

- [x] **Task 54: Fix `applyingRemoteRef` echo-guard timing**
  - Description: Removed the `setTimeout(() => { applyingRemoteRef.current = false; }, 0)` reset entirely — the push-effect (the only reader of this flag) now consumes and resets it itself the first time it observes `true`, right after the same update's re-render. No more timing dependency on a macrotask racing against React's passive-effect scheduling.
  - Acceptance criteria:
    - [ ] A remote-applied snapshot never triggers a redundant echo `pushRoomState` call (verify via Task 51's logging — no push logged immediately following an apply with identical state).
  - Verification: `npx tsc --noEmit`; manual test with logging from Task 51.
  - Dependencies: Task 51 (uses its logging to verify).
  - Files: `src/app/page.tsx`
  - Estimated scope: XS (1 file)

### Checkpoint 13B
- [ ] Two profiles in one room stay in sync on play/pause/next/queue changes, verified live; root cause documented from real logs, not just hypothesis.

### 13C — Expanded player: vinyl + video tab, mobile reveal-on-drag
- [x] **Task 55: `VinylArt` component**
  - Description: New `src/components/VinylArt.tsx` — SVG/CSS rotating vinyl record, track thumbnail centered, `spinning: boolean` prop. Standalone, no dependency on `ExpandedPlayer` internals (also reused by Task 64's `TrackImg` fallback).
  - Acceptance criteria:
    - [ ] Renders with any thumbnail URL (or none) centered inside the vinyl artwork.
    - [ ] Spins continuously via CSS animation when `spinning`, holds still when not.
  - Verification: `npx tsc --noEmit`; visual check in isolation (e.g. temporarily rendered in one existing screen).
  - Dependencies: None.
  - Files: `src/components/VinylArt.tsx` (new), `src/app/globals.css`
  - Estimated scope: Small (2 files)

- [x] **Task 56: Lagu/Video tab switcher in `ExpandedPlayer`**
  - Description: New top-level view state (`'lagu' | 'video'`) distinct from the existing Antrian/Lirik/Terkait `ExpTab`. Video renders a `youtube.com/embed/{videoId}` iframe in place of the vinyl; audio keeps playing through the existing custom player regardless of which tab is active (video tab is visual-only, no swap of the audio source).
  - Acceptance criteria:
    - [ ] Switching Lagu → Video → Lagu never interrupts audio playback or resets position.
    - [ ] Video tab plays the current track's own `videoId`.
  - Verification: `npx tsc --noEmit`; manual check switching tabs mid-playback.
  - Dependencies: Task 55.
  - Files: `src/components/ExpandedPlayer.tsx`
  - Estimated scope: Small (1 file)
  - Bug fix (live device test): opening the Video tab produced doubled/clashing audio — the YouTube iframe plays its own native audio by default, on top of the custom audio player that was still running. Fixed by adding `&mute=1` to the embed URL so the iframe is purely visual; audio comes only from the existing custom player.

- [x] **Task 57: Two-pane mobile layout (vinyl/video top, sheet bottom)**
  - Description: Rework `ExpandedPlayer`'s mobile layout into a fixed top pane (vinyl/video + Lagu/Video tabs) and a bottom sheet (existing Antrian/Lirik/Terkait tabs + content) that starts collapsed to a peek/handle.
  - Acceptance criteria:
    - [ ] Expanding on mobile shows only vinyl/video + tab switcher first; Antrian/Lirik/Terkait not visible until revealed.
  - Verification: `npx tsc --noEmit`; manual check on a mobile viewport.
  - Dependencies: Task 56.
  - Files: `src/components/ExpandedPlayer.tsx`, `src/app/globals.css`
  - Estimated scope: Medium (2 files)
  - Refinement (post-deploy feedback, real YT Music mobile screenshot): moved the Lagu/Video switcher from text tabs above the art into a compact icon-only pill (headphone/video icons) in the top bar, next to the collapse chevron — matches the reference exactly. Kept `VinylArt` for the "Lagu" state (user explicitly confirmed keeping the spinning vinyl over flat album art). Skipped the reference's like/dislike/Lirik/comments chip row — no dislike or comments feature exists in this app, confirmed out of scope for now (user's explicit choice).

- [x] **Task 58: Drag-to-reveal gesture on the bottom sheet**
  - Description: Pointer/touch handlers on the sheet's handle adjusting height/translateY live, snapping open/closed past a threshold — extends the existing `compact-art` shrink transition rather than replacing it.
  - Acceptance criteria:
    - [ ] Dragging the handle up past the threshold reveals the full Antrian/Lirik/Terkait layout (matches today's current expanded look).
    - [ ] Dragging back down re-collapses to the peek/handle.
  - Verification: Manual check on a real mobile device or touch-emulated devtools.
  - Dependencies: Task 57.
  - Files: `src/components/ExpandedPlayer.tsx`, `src/app/globals.css`
  - Estimated scope: Medium (2 files)
  - Refinement: moved the sheet to dock below `.expanded-controls` (seek bar + playback buttons) instead of overlapping the art — matches the reference, where controls stay visible and only a handle + artist-name peek label show below them until dragged open. `.expanded-controls` gets extra bottom padding on mobile to reserve room for the peek strip.
  - Bug fix (live device test): drag gesture didn't work at all — root cause was the pointer handlers only being bound to the 4px-tall visual handle bar, an unusable touch target. Fixed by moving the handlers onto a full-width 44px `.expanded-sheet-grip` zone (the handle bar + peek label are now purely decorative children inside it).
  - Refinement round 2 (real YT Music screenshots): (1) sheet now opens to ~92vh (was 70vh) — "agak full ke atas" per the reference; (2) added `.expanded-sheet-mini-header` (small thumbnail + title/artist + play/pause) shown only when the sheet is open, standing in for the big vinyl/video that's now covered; (3) `.expanded-art-meta` reworked to a centered flex row (title/artist text block + like button beside it, not stacked below); (4) the Video tab's iframe now starts at the current audio position with matching autoplay state when switched to (`videoStart` snapshot, only taken at the switch moment — not continuous re-sync, see code comment on the drift limitation).

- [x] **Task 59: Desktop layout — vinyl + Video tab**
  - Description: Reuse `VinylArt` + the Lagu/Video tab switcher in the existing desktop `ExpandedPlayer` layout (which already has room for Antrian/Lirik/Terkait alongside, no drag-sheet needed there).
  - Note: satisfied automatically by Task 56/57 — the vinyl/video + tab switcher live in the shared (non-media-query) `.expanded-art-col` markup, and `.expanded-sheet`'s absolute-position/drag-transform CSS is scoped entirely inside `@media(max-width:768px)`, so desktop keeps the original plain flex-column Antrian/Lirik/Terkait layout untouched. Also deleted the now-dead `.expanded-art-col img` CSS rule (no more raw `<img>` there).
  - Acceptance criteria:
    - [ ] Desktop expand (existing `onToggleExpanded` entry point) shows vinyl by default, Video tab available, Antrian/Lirik/Terkait unaffected.
  - Verification: `npx tsc --noEmit`; manual check on desktop viewport.
  - Dependencies: Task 56.
  - Files: `src/components/ExpandedPlayer.tsx`
  - Estimated scope: Small (1 file)

- [x] **Task 60: Update intent docs**
  - Description: Update `docs/intent/mkmusic_intent.md`'s Out-of-Scope line per the original note in `docs/intent/expanded-player-video.md` (deliberate scope change, not an oversight); mark that intent doc as done/superseded by this Phase 13 section.
  - Acceptance criteria:
    - [ ] Both docs reflect the current, shipped state.
  - Verification: Read-through.
  - Dependencies: Task 59.
  - Files: `docs/intent/mkmusic_intent.md`, `docs/intent/expanded-player-video.md`
  - Estimated scope: XS (2 files, docs only)

### Checkpoint 13C
- [ ] Mobile: vinyl/video-first expand with drag-to-reveal tabs. Desktop: vinyl + Video tab from the existing expand entry point. Audio never interrupted by tab switches.

### 13D — Queue drag-and-drop reorder
- [x] **Task 61: `onReorderQueue` handler in `src/app/page.tsx`**
  - Description: Splices `queue` to move an item from one index to another, adjusting `currentIndex` so the actually-playing track keeps playing through a reorder that moves it (including across `currentIndex` itself).
  - Acceptance criteria:
    - [ ] Reordering any non-playing item doesn't change what's currently playing.
    - [ ] Reordering the currently-playing item itself keeps it playing (not restarted) at its new position.
  - Verification: `npx tsc --noEmit`; manual test moving items before/after/across the playing track.
  - Note: the move + index-adjustment math was pulled out into pure functions in `src/lib/reorder.ts` (`moveItem`, `adjustIndexAfterMove`), with a standalone assert-based self-check at `scripts/test-reorder.ts` (`npx tsx scripts/test-reorder.ts` — all pass). Manual in-app drag test still pending (needs a live session).
  - Dependencies: None.
  - Files: `src/app/page.tsx`, `src/lib/reorder.ts` (new), `scripts/test-reorder.ts` (new)
  - Estimated scope: Small (1 file)

- [x] **Task 62: Native drag-and-drop in `Queue.tsx` (desktop)**
  - Description: `draggable`/`onDragStart`/`onDragOver`/`onDrop` on each up-next row, calling `onReorderQueue` on drop. No new dependency — native HTML5 DnD.
  - Acceptance criteria:
    - [ ] Dragging a row to a new position visibly reorders the list and updates playback order.
  - Verification: `npx tsc --noEmit`; manual drag test.
  - Dependencies: Task 61.
  - Files: `src/components/Queue.tsx`
  - Estimated scope: Small (1 file)
  - Bug fix (live device test): reorder didn't work on mobile at all — root cause was that native HTML5 drag-and-drop (`draggable`/`dragstart`/`dragover`/`drop`) is a mouse-only API that never fires for touch input on any mobile browser, no polyfill involved. Rewrote `useDragReorder` to use Pointer Events (`onPointerDown`/`onPointerMove`/`onPointerUp` + `document.elementFromPoint` to find the row under the finger) instead — one implementation that actually works for both mouse and touch. Also added a dedicated small drag-handle icon per row (matching the reference's ☰ icon) instead of making the whole row draggable, since a plain touch-drag on the row would otherwise fight with the list's own vertical scroll — only the handle gets `touch-action:none`.
  - Animation follow-up: dragged row now lifts (scale + shadow, animated via CSS transition) instead of a flat opacity fade, and the hovered drop target gets an animated accent-colored top border indicating where it'll land. CSS-only, no JS position measuring — doesn't animate *other* rows sliding out of the way live during the drag (that would need a FLIP-style position-measuring implementation); the list only visually reorders once the drag ends. Worth upgrading to full FLIP later if the current "highlight + lift" feedback isn't enough.

- [x] **Task 63: Same drag-and-drop in `ExpandedPlayer`'s Antrian tab (mobile)**
  - Note: implemented alongside Task 57 (touched the same queue-rows block anyway). The currently-playing row has no drag handle at all, matching Task 61's up-next-only contract.
  - Description: Same handlers, same `onReorderQueue` call, wired onto the mobile Antrian tab's row list.
  - Acceptance criteria:
    - [ ] Touch-drag reorders the queue identically to the desktop panel.
  - Verification: Manual test on a touch device/emulator.
  - Dependencies: Task 62.
  - Files: `src/components/ExpandedPlayer.tsx`
  - Estimated scope: Small (1 file)

### Checkpoint 13D
- [ ] Queue reorder works via drag-and-drop in both `Queue.tsx` and the mobile Antrian tab; playing track never gets interrupted by a reorder.

### 13E — Broken image → vinyl fallback
- [x] **Task 64: `TrackImg` component**
  - Description: `src/components/TrackImg.tsx` — wraps `<img>`, swaps to a static (non-spinning) `VinylArt` `onError`. Same `className`/sizing props pass through unchanged.
  - Acceptance criteria:
    - [ ] A deliberately-broken `src` renders the vinyl placeholder instead of a broken-image icon.
  - Verification: `npx tsc --noEmit`; manual test with a broken URL.
  - Dependencies: Task 55.
  - Files: `src/components/TrackImg.tsx` (new)
  - Estimated scope: XS (1 file)

- [x] **Task 65: Swap high-traffic `<img>` call sites to `TrackImg`**
  - Description: Replace raw `<img src={t.thumbnail}>` (and album/artist/playlist equivalents) with `TrackImg` in `Home.tsx`, `Search.tsx`, `Queue.tsx` — the highest-traffic thumbnail spots. Lower-traffic spots (modals, Account page) can follow later, not blocking this phase.
  - Acceptance criteria:
    - [ ] Every thumbnail in Home/Search/Queue falls back to the vinyl placeholder on a load error.
  - Verification: `npx tsc --noEmit`; spot-check each file.
  - Dependencies: Task 64.
  - Files: `src/components/Home.tsx`, `src/components/Search.tsx`, `src/components/Queue.tsx`
  - Estimated scope: Medium (3 files)

- [x] **Task 66: Preserve the existing artist-thumbnail fallback ordering**
  - Description: `HomeSectionRow`'s existing `onError` (falls back to a guessed `hqdefault.jpg` URL first) should stay as the *first* fallback, with `TrackImg`'s vinyl only kicking in if that guessed URL *also* fails — don't regress the case that already works.
  - Acceptance criteria:
    - [ ] Artist cards still try the `hqdefault.jpg` guess before falling back to vinyl.
  - Verification: `npx tsc --noEmit`; manual check.
  - Dependencies: Task 65.
  - Files: `src/components/Home.tsx`
  - Estimated scope: XS (1 file)

### Checkpoint 13E
- [ ] No broken-image icons anywhere in Home/Search/Queue — vinyl placeholder shows instead, existing artist-thumbnail fallback still tried first.

## Phase 13 done criteria
- [ ] All 5 sub-phases (13A-13E) shipped, typecheck clean, ponytail-review clean per sub-phase, no regression to Home/Search/Queue/Player behavior already built this session.

**Status: all code shipped, `npx tsc --noEmit` clean, dev server healthy.**
What's left is exclusively live/manual verification (Task 50, 13B's real
two-profile test, 13C/13D's mobile-device check) — every one of those
requires actually logging into the app first, which is gated behind a
Cloudflare Turnstile CAPTCHA on both sign-in and sign-up. Completing or
bypassing a CAPTCHA isn't something this assistant does, session or no
session — so these specific items can only be verified by the user
directly, not delegated further. Everything not blocked by that has been
done.
