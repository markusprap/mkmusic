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

### Phase 6: Google Accounts (Revision 3, part 1)
- [x] Task 17: `docs/supabase-migration-v3.sql` — add `account_id` to `profiles`, enable RLS scoped to `account_id = auth.uid()`. Manual: enable Google OAuth provider in Supabase dashboard.
- [x] Task 18: Install `@supabase/ssr`; add `middleware.ts` for session cookie refresh; add `/auth/callback` route handler.
- [x] Task 19: Login screen (Google button + email/password sign-up/sign-in form, name/confirm-password fields, Cloudflare Turnstile) gating the profile picker; wire `account_id` into profile create/list so `/api/profiles` is scoped server-side via the authenticated session, not client-supplied.
- [x] Task 20: Profile settings UI (rename, avatar/color, PIN change) — API already exists from Revision 2, UI was missing.
- [x] Task 21: Sign-out action distinct from "Ganti Profil".

### Checkpoint: Accounts
- [x] A fresh visitor sees a login screen (Google or email/password), not any existing profile. After login, only that account's own profiles are visible/selectable. PIN entry still required per profile on top of that. Verified live: a stray permissive "Public Access" RLS policy left over from Revision 2 was found and dropped during testing — see docs/supabase-migration-v3.sql.

### Phase 7: Rooms (Revision 3, part 2 — depends on Phase 6)
- [x] Task 22: `rooms` + `room_members` tables + RLS scoped to `account_id`. Simplified from the original Realtime-Authorization-broadcast plan to Postgres Changes on the `rooms` row — Supabase's realtime replication already honors RLS, so the same-account boundary falls out of the `rooms` SELECT policy with no separate private-channel setup.
- [x] Task 23: Room create/join/leave API + UI (shareable code, member avatars) — Sidebar (desktop) + TopBar profile menu (mobile).
- [x] Task 24: Realtime sync + persistence for play/pause/seek/skip/queue changes; `activeRoom` state in `page.tsx` overriding local queue/player state while joined; leaving a room happens automatically on profile switch/sign-out.

### Checkpoint: Rooms
- [ ] Two profiles under the same account, on two different devices/tabs, join the same room and hear the same track at the same position; either can pause/skip/add a song and the other sees it within ~1s. Needs `docs/supabase-migration-v4.sql` run manually + live testing (not yet done).

### Phase 8: Desktop scroll-row navigation arrows
- [x] Task 25: `useHScroll` hook (`src/components/Home.tsx`) — ref + scroll-position state (`canPrev`/`canNext`) + `scrollPrev`/`scrollNext` (smooth `scrollBy` one viewport-width at a time). One hook, reused per row instance (not shared state) — each scrollable row owns its own ref/position.
- [x] Task 26: Reuse the existing `.topbar-nav-btn` circular-button style (already used for the desktop back/forward nav in `TopBar.tsx`, including its `:disabled` look) for the Prev/Next pair — no new button CSS.
- [x] Task 27: Wire the hook + buttons into the three scroll surfaces in `Home.tsx`: the `.quick-grid` (Pilihan Cepat), inside `TrackRow` (covers Baru Diputar/Untuk Kamu/Favorit Lama), and a new small `HomeSectionRow` component extracted from the current inline `sections.map(...)` block (covers every realSections/extraSections row).
- [x] Task 28: Hide the arrow pair under the existing mobile breakpoint (`@media (max-width:768px)` in `globals.css`) — touch swipe already works there, matches the reference (mobile app screenshots earlier this session never showed these arrows).

### Checkpoint: Scroll arrows
- [x] On desktop, every horizontally-scrolling Home section shows a Previous/Next button pair next to its title; Previous is disabled at the start, Next disabled at the end, both scroll smoothly by about one viewport-width. On mobile width, no arrows render and touch-swipe scrolling still works. Shipped with one bug fix along the way: `useHScroll` originally measured the row once on mount, but rows start out empty/skeleton (no real element yet) — switched to a state-based ref callback so measuring re-runs when the real element attaches.

### Phase 9: "Baru dari {Artist}" + "Playlist trending komunitas"
Two of the three Home sections confirmed via an interview-me pass earlier this session (reference: a YT Music screenshot showing "Baru dari Denny Caknan", "Playlist trending komunitas", "Mirip dengan Bernadya"). "Mirip dengan {Artist}" already shipped — it reuses the existing similar-artist-playlist mechanism, restyled with an eyebrow label + avatar, seeded by artist #2 in a new playCounts-based favorite-artist ranking (`favoriteArtistIds`) so it doesn't repeat whichever artist "Baru dari" ends up using for #1.

- [x] Task 29: Favorite-artist ranking (already shipped, groundwork for both remaining sections).
- [x] Task 30: "Baru dari {Artist}" data — second `/api/artist?id=<favoriteArtistIds[0]>` fetch in the existing `Promise.allSettled` batch; pick the newer of `topSingles[0]`/`topAlbums[0]` by year (confirmed live that `topSingles` is already sorted newest-first, `topAlbums` is not) — year-only, per the interview (`ytmusic-api` has no day/month precision anywhere).
- [x] Task 31: "Baru dari {Artist}" card — one-off layout (not the repeating scroll-row pattern), matching the reference: avatar + label, then a wide card (title/"Single • year"/play button left, cover art right). Reuses the existing `.play-btn` class (a ponytail-review pass caught an inline-reinvented green button first).
- [x] Task 32: `/api/playlist` route (new) — wraps `getPlaylistVideos(id)` (the method that actually returns tracks; `getPlaylist()` explicitly excludes them per the library's own docs). Returns `{ count, thumbnails }` — one call per playlist. Verified live against a real playlist.
- [x] Task 33: Community-playlist collage fetching — first 20 playlists already free from `chartRes.value.playlists` (raised from an initial ~8 suggestion per the user's call), fetched through the new route **after** the main sections paint (progressive enrichment, `Promise.allSettled` so one failure doesn't blank the row).
- [x] Task 34: "Playlist trending komunitas" card + row — real 2x2 collage + song count, replacing the old single-thumbnail "Dari Komunitas"; falls back to the single-thumbnail look per-card if that card's collage fetch is slow/fails.

### Checkpoint: Baru dari Artist
- [x] Real favorite-artist profile sees an accurate, distinct-from-"Mirip dengan" latest release card; no play history means no card, not a broken one.

### Checkpoint: Playlist trending komunitas
- [x] Real 2x2 collages + song counts render without delaying the rest of Home, with graceful per-card fallback.

### Phase 10: Real in-app navigation history (Back/Forward)
`TopBar.tsx`'s Back/Forward buttons call raw browser `history.back()`/`history.forward()`, but this SPA never pushes any browser history for its own navigation (`activeTab`/`searchQuery`/`detailView` in `src/app/page.tsx` are plain `useState`) — so clicking Back escapes to whatever real page loaded before the app did (reported bug: lands on the login page). User explicitly chose the full fix over a small one: real in-app history, not browser history.

**Model:** one `NavLocation { tab, searchQuery, detail }` history array + a current-index pointer in `page.tsx`. `activeTab`/`searchQuery`/`detailView` become derived reads (`navHistory[navIndex]`) instead of independent state — every existing reader of those three names elsewhere in the file keeps working unchanged. Two write operations: `pushNav(partial)` (truncates any "forward" entries past the pointer, then appends — standard browser-history-on-navigate-after-back semantics) for explicit navigation, and `replaceNav(partial)` (mutates the current entry in place, no new entry) for live search-box typing — this distinction is the one thing that has to be right, otherwise Back/Forward gets flooded with one entry per keystroke.

- [x] Task 35: `NavLocation` type + `navHistory`/`navIndex` state + `pushNav`/`replaceNav`/`goBack`/`goForward`/`canGoBack`/`canGoForward` in `page.tsx`; remove the old `activeTab`/`searchQuery`/`detailView` `useState` calls, replace with derived consts from `navHistory[navIndex]`.
- [x] Task 36: Rewrite the 8 existing call sites against the new model, signatures unchanged so no other file needs to change: `openArtist`/`openAlbum` → `pushNav({ detail: ... })`; `handleTabChange` → `pushNav({ tab, detail: null })`; `handleSearchQuery` (live typing) → `replaceNav` unless the tab isn't already 'search' yet (first keystroke pushes into the search tab, subsequent ones replace); the two `onSearch` closures (Home's mood chips, Discover's categories) and Search's `onCategoryClick` → `pushNav` (explicit one-shot navigation); both `onBack` props (Artist.tsx, Album.tsx) → `goBack`.
- [x] Task 37: `TopBar.tsx` — replace `onClick={() => history.back()}`/`history.forward()` with `onBack`/`onForward` props, add `disabled={!canGoBack}`/`disabled={!canGoForward}` (the `.topbar-nav-btn:disabled` style already exists); wire the four new props from `page.tsx`.
- [x] Task 38: Reset `navHistory`/`navIndex` to a fresh single-entry stack inside `handleProfileSelect` — otherwise switching profiles lets you "back" into a previous profile's browsing state.

### Checkpoint: Navigation history
- [x] Typecheck-verified end-to-end wiring: open detail view → Back derived from real navIndex pointer (never touches browser history) → Forward returns. Search typing uses replaceNav, explicit navigation uses pushNav. Profile switch resets the stack. Manual click-through in a live session still pending from the user.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube / Invidious stream rate-limiting | High | Fall back across multiple public Invidious/Piped API instances |
| No active internet for cloud DB | Medium | Graceful fallback to browser `localStorage` for offline playlist caching |
| `getPlaylistVideos()` returns a community playlist's *entire* track list just to read 4 thumbnails — a playlist with hundreds of songs means a proportionally large response per card | Medium | Fetch happens after the main Home paint (progressive, not blocking); capped to 20 community-playlist cards total, not the full search result set |
| Live search typing accidentally pushing one history entry per keystroke would make Back/Forward useless | Medium | `replaceNav` (in-place mutation) for typing, `pushNav` only for explicit navigation actions (Task 36) |

### Phase 11: "Playlist unggulan untuk Anda" + "Rekomendasi harian Anda"
Two more Home sections from the same reference screenshot pass (interview-me confirmed). User simplified "Playlist unggulan" mid-interview to reuse the plain existing card style — no poster-style overlay after all — which turns it into a near-zero-cost addition.

- [x] Task 39: "Playlist unggulan untuk Anda" — reuse `dangdutRes.value.playlists` (already fetched for the "Dangdut" track section, its `.playlists` field has been sitting unused this whole time — same free-reuse trick already used for "Playlist trending komunitas" via `chartRes.value.playlists`, just a different already-fetched query). One `extraSections.push({...})` block, renders through the existing generic `HomeSectionRow` — zero new component code.
- [x] Task 40: "Rekomendasi harian Anda" data — no new fetch; slice `chartRes.value.tracks` at index 10-20 (indices 0-9 already went to "Chart Global" + the Pilihan Cepat "pilihan" bucket, 10-20 has been sitting completely unused in the same already-fetched response).
- [x] Task 41: `HeroTrackRow` component — new full-bleed hero card (image fills the card, title+artist overlaid at the top over a dark gradient for legibility, no fabricated view-count or description text — both confirmed out of scope). Horizontally scrollable using the existing `useHScroll`/`ScrollArrows`, "Putar Semua" button in the header matching Pilihan Cepat's pattern.

### Checkpoint: Playlist unggulan + Rekomendasi harian
- [x] Both sections appear on Home with zero new network requests (Task 39/40 both reuse data already fetched for other sections); the hero cards render legible overlaid text over any image via the gradient, scroll correctly, and "Putar Semua" plays the pool.

### Phase 12: "Dari komunitas" redesign + "Video musik untuk Anda"
Confirmed via interview-me. "Dari komunitas" goes from a small square card to the real reference's expanded layout (collage + title + creator + song count + a 3-track preview list + one working Play button) — no view-count anywhere (confirmed, again, that no ytmusic-api type carries one). "Video musik untuk Anda" is a genuinely new fetch (searchVideos() alone, not blended with Music-catalog songs like every other row) since there was no already-fetched-but-unused pool to reuse this time.

Also recorded for later, NOT in this phase's scope: `docs/intent/expanded-player-video.md` — a vinyl-record now-playing view + a Video tab that plays the real YouTube video, raised by the user while discussing this phase. Deliberately parked; needs its own interview-me pass before it's planned.

- [ ] Task 42: Extend `/api/playlist` (`src/app/api/playlist/route.ts`) to also return `tracks: [{id,title,artist,thumbnail}]` for the first 3 videos — same `getPlaylistVideos()` call already made for the collage/count, just reading more fields off the same response. No new request.
- [ ] Task 43: Extend the `CommunityPlaylist` type + its progressive-enrichment `setCommunityPlaylists` logic in `Home.tsx` to carry `tracks` alongside `count`/`thumbnails`.
- [ ] Task 44: Redesign `CommunityPlaylistRow`'s card markup to the reference's expanded layout: collage + title + creator + "{count} lagu" (no views stat) + a 3-row track preview (each with its own `TrackMenu`) + one Play button that queues the 3 preview tracks (`onPlay(tracks[0], tracks)`). Drop the cast/save icon buttons from the reference — no corresponding feature exists in this app yet.
- [ ] Task 45: `searchYouTubeVideos(query)` in `src/lib/youtube.ts` — thin wrapper around `client.searchVideos()` alone (not merged with `searchSongs()` like `searchYouTubeTracks()` does), so results keep their real (usually widescreen) video thumbnails distinctly.
- [ ] Task 46: New `/api/videos?q=` route wrapping Task 45, following the same conventions as every other route in `src/app/api/*`.
- [ ] Task 47: Wire a new fetch into `fetchHome`'s `Promise.allSettled` batch + new `videoPicks` state.
- [ ] Task 48: Render "Video musik untuk Anda" by adding an optional `wide` prop to the existing `TrackRow` component (applies a `.card-img-wrap.wide{aspect-ratio:16/9}` modifier class instead of the default square) rather than building a new sibling component — the only actual visual difference from every other `TrackRow` usage is the thumbnail's aspect ratio.

### Checkpoint: Dari komunitas + Video musik
- [ ] "Dari komunitas" cards show the expanded layout with a working 3-track preview + Play button, no fabricated stats. "Video musik untuk Anda" shows real wide video thumbnails via its own fetch, scrolls, and "Putar Semua" works.

## Phase 12 done criteria
- [x] All seven tasks shipped, typecheck clean, ponytail-review clean, no regression to existing sections/rows.

---

# Implementation Plan: Phase 13 — Auth flow order, Room sync bug, Expanded player redesign, Queue reorder, Image fallback

Seven items handed over in one batch by the user right before stepping away
("plan dan buat spec dulu ... biar sekalian jalan"). Researched directly
against the current codebase (no live Supabase dashboard access — OAuth for
the Supabase MCP needs an interactive browser flow, skipped since the user
was about to leave). Grouped into 5 sub-phases below; task numbering
continues from Task 48.

## 13A — Welcome screen moved after login (items 2 & 3)

**Item 2 root cause (confirmed by reading `src/app/page.tsx:425-429`):**
the gating order today is `Splash → Welcome (first-visit intro slides) →
Login → ProfileSelect`. `Welcome` is gated purely by a `localStorage`
flag (`mkmusic_welcomed`), checked *before* `hasSession`. Fix is a
one-line reorder: check `hasSession` first, so `Login` always renders
before `Welcome` for a signed-out visitor, and `Welcome` only ever shows
to an already-authenticated session (still first-visit-per-browser, via
the same localStorage flag — no new state needed).

**Item 3 status: already implemented, no fix needed.** Read
`src/components/Login.tsx:97-112` — on signup with email-confirmation
off, the code already signs the new session back out, switches the form
to sign-in mode, and shows `"Akun berhasil dibuat, silakan masuk"` before
the user ever reaches a logged-in screen. If email-confirmation is ON in
the Supabase project instead, the existing `checkEmail` branch shows a
"check your email" message, which is the correct behavior for that case
too. Flagging this as **verify only** — if the user actually saw a bare
redirect-to-login with no message, that means something in their test
didn't hit this code path (e.g. a stale deployed build), not a code gap.

- [ ] Task 49: Reorder the two early-return checks in `src/app/page.tsx` so `if (!hasSession) return <Login />;` comes before `if (showWelcome) return <Welcome .../>;`.
- [ ] Task 50: Manual verify only (no code change expected) — run through signup once against the real Supabase project and confirm the "Akun berhasil dibuat, silakan masuk" message actually appears. If it doesn't, that's a new, different bug to research (report back before touching Login.tsx further).

### Checkpoint 13A
- [ ] Signed-out visitor sees Login first, never the intro slides. Welcome shows once, right after first login, not before.

## 13B — Room sync bug (item 4)

**Deep research done — root cause is a hypothesis, not yet empirically
confirmed** (would need a live two-browser test against the real Supabase
project, or dashboard/SQL access neither of which was available this
session without an interactive OAuth flow). What was confirmed by reading
the code:

- The sync design (`src/app/page.tsx:213-294`, `src/lib/rooms.ts`,
  `src/app/api/rooms/**`) is architecturally sound: writes go through
  server API routes (`PUT /api/rooms/[id]`), reads/live-updates come from
  a Supabase Realtime `postgres_changes` subscription on the `rooms`
  table, filtered by room id. Both profiles join the *same* `room.id`
  under the *same account* (`account_id = auth.uid()`), so the RLS
  policies in `docs/supabase-migration-v4.sql` don't distinguish between
  the two profiles — this isn't a per-profile permission gap.
- What Realtime *does* require, and what nothing in this codebase
  currently verifies: (a) `alter publication supabase_realtime add table
  rooms;` / `... add table room_members;` from that same migration must
  have actually been run against the live project (a manual step, per
  every migration in this repo's history — easy to have been missed),
  and (b) the websocket subscription needs a valid authenticated
  Realtime connection for RLS to evaluate `auth.uid()` correctly, which
  supabase-js normally wires up automatically but isn't logged/verified
  anywhere here if it silently fails.
- There is currently **zero observability** into whether the
  `.subscribe()` call in `src/app/page.tsx:292` ever reaches `SUBSCRIBED`
  status, or whether `postgres_changes` events are arriving at all — no
  status callback, no console logging. This is why the bug is hard to
  pin down remotely: it fails silently either way (migration not run, or
  RLS/auth mismatch) and looks identical from the outside — "the other
  profile just doesn't move."
- Secondary, lower-confidence finding: `applyRoomSnapshot` clears its
  own-echo guard (`applyingRemoteRef.current`) via `setTimeout(..., 0)`
  (`src/app/page.tsx:244`), racing against the push-effect's passive
  effect firing on the same state update. If the timing loses, the
  client would redundantly echo its own just-applied remote state back
  to the server — wasteful, but not the reported symptom (a *missing*
  update), so this is a secondary hardening item, not the primary fix.

**Fix strategy: make sync correct regardless of *why* Realtime isn't
delivering**, rather than betting everything on one root cause being the
only one — added resilience here directly serves "beneran sinkron" instead
of leaving a single point of failure. Add a lightweight polling fallback
(fetch `/api/rooms/[id]` every few seconds while a room is active) as a
second delivery path alongside Realtime, plus the diagnostics needed to
actually confirm which path was broken once the user can test live.

- [ ] Task 51: Add `.subscribe((status) => ...)` status logging (temporary, console-only) to the Realtime channel in `src/app/page.tsx`, plus a log line inside the `postgres_changes` UPDATE callback confirming a payload was received. Ship this even if the polling fallback (Task 53) ends up being the real fix — it's what makes the *next* room-sync bug report diagnosable in minutes instead of another deep-research pass.
- [ ] Task 52: Ask the user to confirm (Supabase dashboard → Database → Replication) that `rooms` and `room_members` are actually listed under the `supabase_realtime` publication. If not, re-running `docs/supabase-migration-v4.sql`'s two `alter publication` lines fixes it directly — no code change needed for that case.
- [ ] Task 53: Add a polling fallback: while `activeRoom` is set, `fetchRoomRemote(activeRoom.id)` on an interval (~4s) and run its result through the existing `applyRoomSnapshot` (which already no-ops on a pure echo of local state, so this is safe to layer on top of the existing Realtime path, not a replacement for it).
- [ ] Task 54: Fix the `applyingRemoteRef` echo-guard race — replace the `setTimeout(..., 0)` reset with clearing the flag synchronously after the state-setting calls (React 18 batches those setters into one commit, so the passive push-effect for this same update won't see a stale `true`), removing the timing dependency entirely.

**Update:** Task 52 ruled out the missing-publication hypothesis — user
confirmed via the Supabase SQL editor that `rooms` is already a publication
member (`ERROR: 42710: ... already member of publication`). The bug is
somewhere in RLS/Realtime-auth or app-side logic, not a missing migration
step. Proceeding with Task 53 (polling fallback) and Task 54 (echo-guard
fix) regardless, since both are correct improvements independent of the
exact cause; Task 51's logging (shipped) will confirm the real cause on
the next live two-profile test.

### Checkpoint 13B
- [ ] Two profiles in the same room: any profile's play/pause/next reaches the other profile within the polling interval at worst, immediately at best (Realtime). Root cause confirmed (via Task 51's logs on the user's next live test) and documented for real, not left as a hypothesis.

## 13C — Expanded player redesign: vinyl + video tab, mobile reveal-on-drag (items 1 & 5)

Resolves `docs/intent/expanded-player-video.md` (parked earlier this
session, explicitly flagged as needing its own planning pass). The
user's item 5 description this turn answers every open question that
doc listed:

- **"Does a track have a video?"** — moot. Every track in this app is a
  YouTube video already (`videoId` is the track's own identity even for
  audio-first "song" results) — there's no separate has-video check
  needed. The "Video" tab always plays *the current track's own*
  `videoId` as a real embedded video instead of the audio-only stream;
  "Lagu" tab is the existing audio+art experience.
- **Vinyl visual**: CSS/SVG-drawn (concentric grooves + a center hole),
  not a licensed image asset — the track's own thumbnail sits in the
  center, and the whole thing spins via CSS `animation` while playing,
  pausing when paused. This same component also answers item 7 for the
  *fallback* case (see 13E) — one visual, two uses.
- **Mobile behavior change** (this is the actual behavior swap being
  asked for): today, expanding on mobile shows the Antrian/Lirik/Terkait
  tabs immediately. New behavior, matching the reference (YT
  Music/Spotify-style layered sheet):
  1. Expanding first shows only the big vinyl (or video, if that tab is
     selected) + a "Lagu"/"Video" tab switcher, full-height.
  2. The Antrian/Lirik/Terkait tab bar + its content is a separate sheet
     stacked *below* the vinyl, initially only a peek/handle showing at
     the bottom.
  3. Dragging that handle upward reveals it — becomes today's existing
     expanded layout (tabs + list), with the vinyl/video area shrinking
     to make room (mirrors the existing `compact-art` mobile mode
     already built earlier this session, which is the same "art
     shrinks, list takes over" idea already half-built).
- **Desktop**: per the original intent doc, clicking the current-track
  title area (or the existing expand icon — both already call
  `onToggleExpanded`/open `ExpandedPlayer`) opens the same vinyl+Video-tab
  view; desktop has room to just show vinyl/video and the
  Antrian/Lirik/Terkait tabs side-by-side or stacked without the
  drag-reveal gesture (no scarce vertical space to manage like mobile).

- [ ] Task 55: Build `VinylArt` component — SVG/CSS rotating vinyl record with the track's thumbnail centered, `spinning: boolean` prop (tied to `isPlaying`), reusable standalone (no dependency on `ExpandedPlayer`'s internals).
- [ ] Task 56: Add a `'video'` option alongside a renamed `'lagu'` default to `ExpandedPlayer`'s top-level view state (distinct from the existing `ExpTab` — that one is Antrian/Lirik/Terkait, this is a new higher-level Lagu/Video switcher sitting above it). Video tab renders a YouTube iframe embed (`https://www.youtube.com/embed/{videoId}`) in place of the vinyl; switching back to Lagu keeps the existing custom audio player driving playback (video tab is visual-only, audio continues through the existing player — no swap of the actual audio source, avoiding any interaction with the background-mode/stream-caching work done earlier this session).
- [ ] Task 57: Rework `ExpandedPlayer`'s mobile layout into two stacked panes: a fixed-height top pane (vinyl/video + Lagu/Video tabs) and a bottom sheet (existing Antrian/Lirik/Terkait tabs + list) that starts collapsed to a small peek/handle.
- [ ] Task 58: Implement the drag-to-reveal gesture on the bottom sheet's handle (pointer/touch events adjusting the sheet's height/translateY live, snapping open/closed past a threshold) — mirrors the existing `compact-art` shrink transition already in `globals.css`, extended rather than replaced.
- [ ] Task 59: Desktop layout: same `VinylArt` + Lagu/Video tabs, Antrian/Lirik/Terkait shown without the mobile drag-sheet (already has the room; reuse existing desktop `ExpandedPlayer` layout, just swap the static art for `VinylArt` + add the tab switcher above it).
- [ ] Task 60: Update `docs/intent/mkmusic_intent.md`'s Out-of-Scope line per the intent doc's own note (this phase is the deliberate scope change), and mark `docs/intent/expanded-player-video.md` as done/superseded by this plan section.

### Checkpoint 13C
- [ ] Mobile: expanding shows vinyl/video first, tabs hidden below a handle; dragging up reveals Antrian/Lirik/Terkait exactly like today's current layout. Desktop: vinyl + Video tab available from the existing expand entry point. Video tab plays the real YouTube video for the current track; switching tabs never interrupts audio playback.

## 13D — Queue drag-and-drop reorder (item 6)

Applies to wherever the up-next list renders: `src/components/Queue.tsx`
(desktop right-panel) and `ExpandedPlayer`'s Antrian tab (mobile, same
underlying queue data). Native HTML5 drag-and-drop (`draggable`,
`onDragStart`/`onDragOver`/`onDrop`) — no new dependency, per this
project's lazy-coding convention; a library is unjustified for a
single-list reorder.

- [ ] Task 61: Add `onReorderQueue(fromIndex: number, toIndex: number)` handler in `src/app/page.tsx`, splicing `queue` in place (must stay correct relative to `currentIndex` — reordering an item from before `currentIndex` to after it, or vice versa, has to shift `currentIndex` to keep pointing at the same still-playing track).
- [ ] Task 62: Wire native drag handlers onto each up-next row in `Queue.tsx`, calling `onReorderQueue` on drop.
- [ ] Task 63: Wire the same handlers onto `ExpandedPlayer`'s Antrian tab rows (same underlying list, mobile touch-drag via the same native DnD API — acceptable on modern mobile Safari/Chrome; no separate touch-only implementation).

### Checkpoint 13D
- [ ] Dragging a queue row to a new position updates playback order immediately in both `Queue.tsx` and the mobile Antrian tab, and the currently-playing track keeps playing uninterrupted through a reorder that moves it.

## 13E — Broken image → vinyl fallback (item 7)

Reuses `VinylArt` (Task 55) as the fallback visual instead of a browser
broken-image icon. Rather than adding an `onError` handler to every
individual `<img>` tag across `Home.tsx`/`Search.tsx`/`Queue.tsx`/etc.
(dozens of call sites), add one small shared component that wraps a
plain `<img>` and swaps to `VinylArt` on error — then swap call sites
to use it in place of raw `<img>` for track/album/artist/playlist
thumbnails.

- [ ] Task 64: Build `TrackImg` component (`src/components/TrackImg.tsx`) — thin wrapper around `<img>` that renders `VinylArt` (static, non-spinning) in its place `onError`, same `className`/sizing props pass through.
- [ ] Task 65: Replace the raw `<img src={t.thumbnail}>` pattern with `<TrackImg>` across the highest-traffic spots first: `Home.tsx` (all card/row variants), `Search.tsx`, `Queue.tsx`. (Lower-traffic spots — modals, Account page — can follow later; not blocking for this phase's done criteria.)
- [ ] Task 66: Confirm the existing artist-thumbnail `onError` fallback in `HomeSectionRow` (`src/components/Home.tsx`, falls back to a guessed `hqdefault.jpg` URL) still makes sense to keep as a *first* fallback before `TrackImg`'s vinyl becomes the *last* resort — i.e. don't regress that one working case.

### Checkpoint 13E
- [ ] A thumbnail URL that 404s/fails anywhere in the app shows the vinyl placeholder, never a browser broken-image icon.

## Phase 13 done criteria
- [ ] All 5 sub-phases (13A-13E) shipped, typecheck clean, ponytail-review clean per sub-phase, no regression to Home/Search/Queue/Player behavior already built this session.

## Open Questions
- 13B: exact root cause (missing migration vs. Realtime auth) unconfirmed without a live test — Task 51's logging is what will answer this for real.
- 13C: whether the mobile drag-sheet needs velocity-based "flick" snapping (like a real bottom sheet) or a simple past-halfway-point threshold is enough — defaulting to the simpler threshold unless it feels wrong in testing.
