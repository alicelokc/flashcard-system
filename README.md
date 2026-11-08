# FlashLearn HK — Spaced-Repetition Flashcards

Production-minded **MVP** for teachers and students: create decks/cards, student submissions with teacher approval (class-wide), SM-2 study, unfamiliar flags, progress, 儲火 streaks, and a class leaderboard.

**Auth: Google sign-in only** (NextAuth Google provider). Teachers are allowlisted via `TEACHER_EMAILS`.

**Database:** local SQLite (`file:./dev.db`) or **PostgreSQL** for Vercel. Free hosts: [Neon](https://neon.tech), Vercel Postgres, or Supabase. For Postgres production, set `provider = "postgresql"` in `prisma/schema.prisma`.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (local) / PostgreSQL (production)
- NextAuth.js **Google** provider with `NEXTAUTH_URL` (falls back to `VERCEL_URL` on Vercel)
- Images: paste a public URL, or upload small files (&lt;500KB) stored as **data URLs** in the DB (no writable filesystem on Vercel)
- Timezone for streak/day boundaries: **Asia/Hong_Kong**

## Quick start (local)

1. Create a Google OAuth **Web** client (see below).
2. Configure env:

```bash
cp .env.example .env
# edit GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TEACHER_EMAILS, NEXTAUTH_SECRET
```

3. Install, push schema, seed, run:

```bash
npm install
npx prisma db push
npm run seed
npm run dev
```

Open http://localhost:3000 and click **使用 Google 登入**.

### Google OAuth setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth client ID** → Application type **Web application**.
3. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR_DOMAIN/api/auth/callback/google` (production)
4. Copy Client ID / Secret into `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Set `TEACHER_EMAILS` to a comma-separated list of teacher Gmail addresses, e.g. `lokcalice@gmail.com`. Everyone else who signs in becomes a **STUDENT**.

Seed creates sample decks/cards owned by the first email in `TEACHER_EMAILS` (so your Google teacher account sees them after login). Placeholder student rows (`student1@seed.local`) exist only for demo leaderboard data — real students use Google.

## Deploy to Vercel

1. Import `https://github.com/alicelokc/flashcard-system` in Vercel.
2. Switch Prisma `provider` to `postgresql` and set a Postgres `DATABASE_URL`.
3. Add environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Postgres URL (Neon / Vercel Postgres / Supabase) |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://flashcard-system.vercel.app` |
| `NEXTAUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `TEACHER_EMAILS` | Comma-separated teacher emails |

4. Add the production redirect URI in Google Cloud Console.
5. Deploy, then sync schema + seed once:

```bash
npx prisma db push
npm run seed
```

`postinstall` / `build` both run `prisma generate`. `vercel.json` sets `buildCommand` to `prisma generate && next build`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
| `npx prisma db push` | Sync schema → DB |
| `npm run seed` | Reset & seed sample data (Google login only) |
| `npm test` | Unit tests (Vitest) |

## Features

1. **Auth** — Google sign-in; `TEACHER_EMAILS` → TEACHER, else STUDENT. First Google sign-in creates the Prisma `User`.
2. **Decks & cards (teacher)** — Create decks (auto-assign all students), add/**edit**/archive cards with optional front/back images (URL or small upload). Archive hides from study without deleting history.
3. **Student submit + approval** — Students submit cards → `PENDING`. Teacher Approves/Rejects. On **Approve**, status → `APPROVED` and the card is visible to the **whole class**; `card_state` rows are created for each classmate.
4. **SM-2 study** — Per-student card state. Due queue only includes **APPROVED** cards.
5. **Unfamiliar** — Flag/unflag; dedicated list.
6. **Progress** — Session bar, deck mastery %, daily goal (default 10 reviews).
7. **儲火 Streak** — Current + longest. Increments when daily goal is met on consecutive HK calendar days.
8. **Leaderboard** — Rank, name, score, streak, reviews this week.
9. **Teacher dashboard** — Pending count, per-student stats.

## SM-2 (simplified)

Ratings: `1=Again`, `2=Hard`, `3=Good`, `4=Easy`.

- **Again**: repetitions → 0, interval → 0, ease −0.2 (min 1.3), next review ≈ 10 minutes later.
- **First successes**: Hard/Good → 1 day; Easy → 2 days.
- **Later**: `interval = round(interval * ease * modifier)` with Hard 1.2 / Good 1.0 / Easy 1.3.

See `src/lib/sm2.ts`.

## Approval workflow (class-wide)

1. Student creates card → `DRAFT` or `PENDING`.
2. Pending cards **never** enter any study queue.
3. Teacher Approves → `APPROVED` + card states for **all** assigned students.
4. Teacher Rejects → `REJECTED` + optional reason; student can edit & resubmit.

## 儲火 streak rules

- “Study day” = calendar date in **Asia/Hong_Kong**.
- When reviews today ≥ `dailyGoal`: consecutive day → streak +1; otherwise streak = 1.
- Miss a day → current streak displays as 0.

See `src/lib/streak.ts`.

## Leaderboard formula

```
score = reviewsThisWeek * 1
      + currentStreak * 5
      + approvedContributions * 10
      + round(accuracy * 20)
```

See `src/lib/leaderboard.ts`.

## Image storage (Vercel-safe MVP)

- Prefer pasting a public **image URL** into the card form.
- Optional file upload (&lt;500KB) returns a `data:` URL stored in `Card.frontImage` / `Card.backImage`.
- No writes to `public/uploads` (read-only on Vercel serverless).

## Project layout

```
prisma/schema.prisma   # data model (sqlite local / postgres prod)
prisma/seed.ts         # sample deck + cards (Google login)
src/lib/auth.ts        # NextAuth Google + TEACHER_EMAILS
src/lib/sm2.ts         # scheduling
src/lib/streak.ts      # 儲火
src/lib/leaderboard.ts # scoring
src/app/api/**         # REST handlers
src/app/**/page.tsx    # UI routes
tests/**               # Vitest unit tests
vercel.json            # buildCommand
```

## Known MVP gaps

- No CSV bulk import UI
- No per-user timezone (fixed Asia/Hong_Kong)
- Large images should use external URLs (data URL cap 500KB)
- Leaderboard refresh is on page load (no websocket)
- New Google students are not auto-assigned to existing decks (teacher may need to re-create / re-assign)

## License

MIT — built for Alice (HK classroom).
