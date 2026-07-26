# Spec: mkmusic Web Music Player

## Objective
Build a personal, ad-free web music player inspired by Spotify and YouTube Music, featuring a Netflix-style profile selector, YouTube audio search & streaming, lyrics view, queue management, trending charts, mood/genre discovery, and cross-device synced playlists per profile.

## Tech Stack
- **Framework**: Next.js 14+ (App Router, React 18+, TypeScript)
- **Styling**: CSS Modules / Vanilla CSS (Sleek Spotify dark mode design system)
- **Audio Engine**: HTML5 Audio + Invidious / Piped / YouTube Data API for search & audio stream retrieval
- **State & Database**: Supabase (PostgreSQL / Realtime) or Upstash KV for profiles and playlists; LocalStorage fallback
- **Hosting / Deployment**: Vercel

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Test: `npm test`

## Project Structure
```
mkmusic/
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── page.tsx         # Main application page (Profile selector & Player)
│   │   ├── layout.tsx       # Root layout & providers
│   │   └── api/             # API routes (search, stream audio proxy, lyrics)
│   ├── components/          # React components
│   │   ├── ProfileSelect.tsx# Netflix-style profile picker
│   │   ├── Sidebar.tsx      # Navigation & library links
│   │   ├── Player.tsx       # Bottom audio player bar with controls
│   │   ├── Search.tsx       # Track search bar & results grid
│   │   ├── Queue.tsx        # Up Next queue list
│   │   ├── Lyrics.tsx       # Synchronized/plain lyrics viewer
│   │   └── Discover.tsx    # Trending & Mood/Genre categories
│   ├── lib/                 # Utilities & API wrappers
│   │   ├── youtube.ts       # YouTube search & audio stream extractor
│   │   ├── lyrics.ts        # Lyrics API fetcher
│   │   └── store.ts         # Profile & playlist state (Supabase / KV / LocalStorage)
│   └── styles/              # Global dark mode tokens & CSS modules
├── docs/
│   ├── intent/              # Confirmed intent docs
│   └── specs/               # Product specifications
└── tasks/                   # Execution plan and task breakdown
```

## Code Style
- **Pragmatic & Simple (Ponytail principles)**: No unnecessary abstractions or complex state libraries; native React hooks (`useState`, `useContext`) and plain async functions.
- **Example Component**:
```tsx
export function PlayerBar({ currentTrack, isPlaying, onTogglePlay }: PlayerProps) {
  if (!currentTrack) return null;
  return (
    <footer className="player-bar">
      <div className="track-info">
        <img src={currentTrack.thumbnail} alt={currentTrack.title} />
        <div>
          <h4>{currentTrack.title}</h4>
          <p>{currentTrack.artist}</p>
        </div>
      </div>
      <button onClick={onTogglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
    </footer>
  );
}
```

## Testing Strategy
- **Framework**: Vitest / React Testing Library
- **Coverage**: Core logic verification (YouTube audio URL parser, playlist state management, profile switcher).
- **Manual Verification**: Run `npm run dev` and test search, audio playback, playlist creation, profile switching, and deployment build (`npm run build`).

## Boundaries
- **Always**: Keep dark mode visual quality high (Spotify aesthetic), handle network errors gracefully when an Invidious/YouTube instance is down, ensure audio plays continuously across page tabs.
- **Ask First**: Introducing external paid APIs or major structural changes to database schemas.
- **Never**: Store API keys in client-side code, inject ads, or force mandatory user authentication for single-device offline use.

## Success Criteria
- [ ] Netflix-style profile selector ("Who's listening?") allows selecting/creating user profiles (e.g. Markus & Pacar).
- [ ] Track search returns YouTube video results with artwork, title, and artist name.
- [ ] Audio stream plays without ad interruptions with standard controls (play/pause, seek, volume, shuffle, repeat).
- [ ] Queue panel shows "Up Next" tracks with drag/re-order capability.
- [ ] Lyrics panel displays track lyrics when available.
- [ ] Trending Chart & Mood/Genre discovery grids display popular tracks and playlists.
- [ ] Playlists & Liked tracks are saved per profile and synced via cloud database (with LocalStorage fallback).
- [ ] Application compiles with `npm run build` without errors and deploys to Vercel cleanly.

## Open Questions
- None. All core intent and constraints clarified during the interview.

---

## Revision 2 (2026-07-26): Spotify UI accuracy + Netflix-style PIN profiles

### Objective
1. Tighten visual accuracy to real Spotify design tokens (colors, key spacing) on the existing Home/Search/Library/Player/Queue/Lyrics/Discover screens — most structure (sidebar, player bar, card hover-play, dynamic album-art color, autoplay/radio via `/api/upnext`, Liked Songs pinned tile, Recently Played row) already matches and stays as-is.
2. Replace the open "click any profile to enter" system with a Netflix-style multi-user system: 4-digit PIN set at profile creation, PIN re-required every time a profile is selected on "Siapa yang mendengarkan?". Cap 5 profiles. Add a manage-profiles mode (edit/delete, PIN-gated).
3. Wipe all existing rows in the Supabase `profiles` table (clean slate, no migration of old data).

### Design tokens corrected to match real Spotify
- `--bg-base`: `#0d0d0d` → `#121212`
- `--bg-card`: `#242424` → `#181818`
- `--bg-card-hv`: `#2a2a2a` → `#282828`
- Player bar background → `#000000` (was `#0a0a0a`)

### Security boundary (Never-simplify-away item)
PIN must never reach the browser in any form (plaintext or hash). All profile reads/writes move behind Next.js API routes (`/api/profiles/*`) using Node's built-in `crypto.scryptSync` (stdlib, no new dependency) for hashing. Client components stop calling Supabase directly for profile data — `src/lib/store.ts`'s direct `supabase.from('profiles')` calls are replaced with `fetch('/api/profiles/...')`.

### New/changed files
- `src/lib/pin.ts` (new, server-only): `hashPin`, `verifyPin` via scrypt + `timingSafeEqual`.
- `src/app/api/profiles/route.ts` (new): `GET` list of public profile fields only (id, name, color, avatar — no pin_hash); `POST` create (hashes PIN server-side).
- `src/app/api/profiles/[id]/route.ts` (new): `PUT` update profile data/PIN (requires current PIN), `DELETE` (requires PIN).
- `src/app/api/profiles/[id]/unlock/route.ts` (new): `POST {pin}` → verifies, returns full profile (liked/playlists/recent) only on success.
- `src/lib/store.ts` (edit): drop browser-side Supabase profile calls; add thin fetch wrappers to the routes above.
- `src/components/ProfileSelect.tsx` (edit): PIN entry (4-box input) on select, PIN + confirm-PIN on create, 5-profile cap, manage/delete mode.
- `src/app/page.tsx` (edit): wire async unlock flow.
- `docs/supabase-migration.sql` (new, one-time manual step — no DDL/service-role access available to Claude Code, requires user to run once in Supabase SQL Editor): adds `pin_hash`/`avatar` columns and deletes existing rows.

### Boundaries (additions)
- **Always**: hash PINs server-side with a per-profile random salt; never return `pin_hash` in any API response.
- **Ask First**: Supabase schema change and profile-table wipe are applied via a SQL file the user runs manually (no DDL access available via the anon key).
- **Never**: send raw or hashed PIN to the client; add a new dependency (bcrypt, etc.) for hashing when `node:crypto` already covers it; add PIN rate-limiting/lockout (YAGNI for a 2-person personal app).

### Out of scope (explicitly, per project constraints)
- Podcasts, Canvas video, Blend, DJ AI, social following — not feasible without Spotify's licensed catalog/backend and out of scope for a YouTube-audio personal player.
