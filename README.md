# FlashLearn HK — Spaced-Repetition Flashcards

Production-minded **MVP** for teachers and students: create decks/cards, student submissions with teacher approval (class-wide), SM-2 study, unfamiliar flags, progress, 儲火 streaks, and a class leaderboard.

**Database: PostgreSQL** (required for Vercel serverless). Free hosts: [Neon](https://neon.tech), Vercel Postgres, or Supabase.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + **PostgreSQL**
- NextAuth.js credentials (bcrypt) with `NEXTAUTH_URL` (falls back to `VERCEL_URL` on Vercel)
- Images: paste a public URL, or upload small files (&lt;500KB) stored as **data URLs** in the DB (no writable filesystem on Vercel)
- Timezone for streak/day boundaries: **Asia/Hong_Kong**

## Quick start (local)

1. Create a free Postgres DB (Neon recommended) and copy the connection string.
2. Configure env:

```bash
cp .env.example .env
# edit DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
```

3. Install, push schema, seed, run:

```bash
npm install
npx prisma db push
npm run seed
npm run dev
```

Open http://localhost:3000

### Demo logins

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Teacher | `teacher@demo.local`  | `teacher123`|
| Student | `student1@demo.local` | `student123`|
| Student | `student2@demo.local` | `student123`|

## Deploy to Vercel

1. Import `https://github.com/alicelokc/flashcard-system` in Vercel.
2. Add environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Postgres URL (Neon / Vercel Postgres / Supabase). For Neon pooler, `?sslmode=require` is typical. |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://flashcard-system.vercel.app` |
| `NEXTAUTH_SECRET` | Long random string (`openssl rand -base64 32`) |

3. Deploy. After the first successful deploy (or before), sync schema + seed once:

```bash
# with production env available locally, or via `vercel env pull`
npx prisma db push
npm run seed
```

Or from any machine with `DATABASE_URL` set to the production DB:

```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run seed
```

4. Open the Vercel URL and log in with the demo accounts above.

`postinstall` / `build` both run `prisma generate`. `vercel.json` sets `buildCommand` to `prisma generate && next build`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
| `npx prisma db push` | Sync schema → Postgres |
| `npm run seed` | Reset & seed demo data (works against Postgres) |
| `npm test` | Unit tests (Vitest) |

## Features

1. **Auth** — Teacher / Student roles; JWT sessions via NextAuth credentials.
2. **Decks & cards (teacher)** — Create decks (auto-assign all students), add/edit cards with optional front/back images (URL or small upload).
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
prisma/schema.prisma   # PostgreSQL data model
prisma/seed.ts         # demo users, deck, reviews, pending cards
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
- No email magic-link (credentials only)
- Large images should use external URLs (data URL cap 500KB)
- Leaderboard refresh is on page load (no websocket)

## License

MIT — built for Alice (HK classroom demo).
