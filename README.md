# FlashLearn HK — Spaced-Repetition Flashcards

Production-minded **MVP** for teachers and students: create decks/cards, student submissions with teacher approval (class-wide), SM-2 study, unfamiliar flags, progress, 儲火 streaks, and a class leaderboard.

Built for local use with **SQLite** (no paid cloud accounts required).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + **SQLite** (`prisma/dev.db`)
- NextAuth.js credentials (bcrypt)
- Image uploads → `public/uploads/` (MVP)
- Timezone for streak/day boundaries: **Asia/Hong_Kong**

## Quick start

```bash
cd flashcard-system
npm install
cp .env.example .env   # if needed
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

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
| `npx prisma db push` | Sync schema → SQLite |
| `npm run seed` | Reset & seed demo data |
| `npm test` | Unit tests (Vitest) |

## Features

1. **Auth** — Teacher / Student roles; JWT sessions via NextAuth credentials.
2. **Decks & cards (teacher)** — Create decks (auto-assign all students), add/edit cards with optional front/back images.
3. **Student submit + approval** — Students submit cards → `PENDING`. Teacher Approves/Rejects. On **Approve**, status → `APPROVED` and the card is visible to the **whole class** (all students assigned to that deck); `card_state` rows are created for each classmate.
4. **SM-2 study** — Per-student card state (`easeFactor`, `interval`, `repetitions`, `nextReview`). Ratings: Again / Hard / Good / Easy. Due queue only includes **APPROVED** cards.
5. **Unfamiliar** — Flag/unflag; dedicated list.
6. **Progress** — Session bar, deck mastery %, daily goal (default 10 reviews).
7. **儲火 Streak** — Current + longest. Increments when daily goal is met on consecutive HK calendar days. Miss a day → current streak resets to 0. Shown with 🔥 on home.
8. **Leaderboard** — Rank, name, score, streak, reviews this week; highlights current user.
9. **Teacher dashboard** — Pending count, per-student stats, links to approvals / leaderboard / decks.

## SM-2 (simplified)

Ratings: `1=Again`, `2=Hard`, `3=Good`, `4=Easy`.

- **Again**: repetitions → 0, interval → 0, ease −0.2 (min 1.3), next review ≈ 10 minutes later.
- **First successes**: Hard/Good → 1 day; Easy → 2 days.
- **Later**: `interval = round(interval * ease * modifier)` with Hard 1.2 / Good 1.0 / Easy 1.3.
- Ease adjusted with a classic SM-2-style delta mapped from the 1–4 rating.

See `src/lib/sm2.ts`.

## Approval workflow (class-wide)

1. Student creates card in an assigned deck → `DRAFT` or `PENDING`.
2. Pending cards **never** enter any study queue.
3. Teacher Approves → `APPROVED` + card states for **all** assigned students.
4. Teacher Rejects → `REJECTED` + optional reason; student can edit & resubmit.
5. Only `APPROVED` cards count in study, mastery, and class stats.

## 儲火 streak rules

- “Study day” = calendar date in **Asia/Hong_Kong** (`YYYY-MM-DD`).
- When reviews today ≥ `dailyGoal` (default 10):
  - If last goal day was **yesterday** → `currentStreak += 1`
  - Else → `currentStreak = 1`
  - Same day → no change
- `longestStreak = max(longest, current)`
- If last study date is before yesterday, **display/persist** current streak as `0`.

See `src/lib/streak.ts`.

## Leaderboard formula

```
score = reviewsThisWeek * 1
      + currentStreak * 5
      + approvedContributions * 10
      + round(accuracy * 20)
```

- `accuracy` = (Good+Easy reviews) / total reviews (0 if none)
- Pending/rejected contributions do **not** count

See `src/lib/leaderboard.ts`.

## Switching to Postgres later

1. In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set `DATABASE_URL` to your Postgres URL in `.env`.
3. Run `npx prisma db push` (or migrate) and `npm run seed`.

## Image storage (S3 later)

MVP writes to `public/uploads/`. For production, replace `/api/upload` with S3-compatible signed uploads and store public/signed URLs on the card.

## Project layout

```
prisma/schema.prisma   # data model
prisma/seed.ts         # demo users, deck, reviews, pending cards
src/lib/sm2.ts         # scheduling
src/lib/streak.ts      # 儲火
src/lib/leaderboard.ts # scoring
src/app/api/**         # REST handlers
src/app/**/page.tsx    # UI routes
tests/**               # Vitest unit tests
```

## Known MVP gaps

- No CSV bulk import UI
- No per-user timezone (fixed Asia/Hong_Kong)
- No email magic-link (credentials only)
- Image delete/replace is manual (re-upload on edit path is limited)
- Leaderboard refresh is on page load (no websocket)

## License

MIT — built for Alice (HK classroom demo).
