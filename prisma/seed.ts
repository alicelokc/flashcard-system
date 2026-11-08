import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

const CHAPTER_COUNT = 37;

/** Light sample pairs so each chapter has something to study. */
const SAMPLE_PAIRS: { front: string; back: string }[] = [
  { front: "Mitochondrion", back: "Powerhouse of the cell; site of aerobic respiration" },
  { front: "Ribosome", back: "Site of protein synthesis" },
  { front: "Nucleus", back: "Contains DNA; controls cell activities" },
  { front: "Chloroplast", back: "Site of photosynthesis in plant cells" },
  { front: "Cell membrane", back: "Selectively permeable barrier around the cell" },
  { front: "Enzyme", back: "Biological catalyst that speeds up reactions" },
  { front: "Photosynthesis", back: "Process converting light energy into chemical energy" },
  { front: "Diffusion", back: "Net movement of particles from high to low concentration" },
];

/**
 * Seed 37 chapter decks for student-chosen study + SM-2 due push.
 * Login is Google-only. Teacher email = first TEACHER_EMAILS entry.
 */
async function main() {
  await prisma.reviewLog.deleteMany();
  await prisma.unfamiliarFlag.deleteMany();
  await prisma.cardState.deleteMany();
  await prisma.card.deleteMany();
  await prisma.deckAssignment.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.user.deleteMany();

  const teacherEmail =
    (process.env.TEACHER_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)[0] || "teacher@seed.local";

  const teacher = await prisma.user.create({
    data: {
      email: teacherEmail,
      name: "Alice 老師",
      role: "TEACHER",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: "student1@seed.local",
      name: "陳小明",
      role: "STUDENT",
      currentStreak: 3,
      longestStreak: 5,
      lastStudyDate: formatHk(new Date()),
      dailyGoal: 10,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: "student2@seed.local",
      name: "李美華",
      role: "STUDENT",
      currentStreak: 1,
      longestStreak: 4,
      lastStudyDate: formatHk(new Date()),
      dailyGoal: 10,
    },
  });

  const students = [student1, student2];
  const allApprovedCards: { id: string; deckIndex: number }[] = [];
  const decks: { id: string; index: number }[] = [];

  for (let n = 1; n <= CHAPTER_COUNT; n++) {
    const title = `Chapter ${String(n).padStart(2, "0")}`;
    const deck = await prisma.deck.create({
      data: {
        title,
        subject: "Biology",
        description: `第 ${n} 章 · 學生可自行點選溫習`,
        createdById: teacher.id,
      },
    });
    decks.push({ id: deck.id, index: n });

    await prisma.deckAssignment.createMany({
      data: students.map((s) => ({ deckId: deck.id, studentId: s.id })),
    });

    // 2–3 sample cards per chapter (placeholders teachers can replace)
    const cardCount = n <= 3 ? 3 : 2;
    for (let i = 0; i < cardCount; i++) {
      const pair = SAMPLE_PAIRS[(n + i) % SAMPLE_PAIRS.length];
      const card = await prisma.card.create({
        data: {
          deckId: deck.id,
          frontText: `${pair.front} (Ch.${n})`,
          backText: pair.back,
          status: "APPROVED",
          sortOrder: i + 1,
        },
      });
      allApprovedCards.push({ id: card.id, deckIndex: n });
    }
  }

  // Pending submissions on Chapter 01 for approvals demo
  const ch1 = decks[0]!.id;
  await prisma.card.create({
    data: {
      deckId: ch1,
      frontText: "Golgi apparatus",
      backText: "Modifies, sorts and packages proteins for secretion",
      status: "PENDING",
      submittedById: student1.id,
      sortOrder: 100,
    },
  });
  await prisma.card.create({
    data: {
      deckId: ch1,
      frontText: "Lysosome",
      backText: "Contains digestive enzymes; breaks down waste",
      status: "PENDING",
      submittedById: student2.id,
      sortOrder: 101,
    },
  });

  // Rejected card so submissions edit/resubmit can be demoed
  await prisma.card.create({
    data: {
      deckId: ch1,
      frontText: "Cell wall (draft)",
      backText: "TODO: fix definition",
      status: "REJECTED",
      submittedById: student1.id,
      reviewedById: teacher.id,
      reviewedAt: new Date(),
      rejectionReason: "請補充植物細胞特有的功能說明",
      sortOrder: 102,
    },
  });

  const now = new Date();
  // SM-2 demo: first few cards of early chapters are due today
  for (const student of students) {
    for (let i = 0; i < allApprovedCards.length; i++) {
      const card = allApprovedCards[i]!;
      const isDueDemo = card.deckIndex <= 5 && i % 3 === 0;
      await prisma.cardState.create({
        data: {
          cardId: card.id,
          studentId: student.id,
          easeFactor: 2.5,
          interval: isDueDemo ? 1 : 4,
          repetitions: isDueDemo ? 1 : 2,
          nextReview: isDueDemo ? subDays(now, 1) : subDays(now, -3),
          lastResult: 3,
        },
      });
    }
  }

  // Review logs this week (leaderboard)
  const sampleIds = allApprovedCards.slice(0, 8).map((c) => c.id);
  for (let d = 0; d < 5; d++) {
    for (let r = 0; r < 4; r++) {
      await prisma.reviewLog.create({
        data: {
          cardId: sampleIds[r % sampleIds.length]!,
          studentId: student1.id,
          rating: r % 2 === 0 ? 3 : 4,
          reviewedAt: subDays(now, d),
        },
      });
    }
    for (let r = 0; r < 2; r++) {
      await prisma.reviewLog.create({
        data: {
          cardId: sampleIds[r % sampleIds.length]!,
          studentId: student2.id,
          rating: r === 0 ? 2 : 3,
          reviewedAt: subDays(now, d),
        },
      });
    }
  }

  await prisma.unfamiliarFlag.create({
    data: { cardId: allApprovedCards[0]!.id, studentId: student1.id },
  });

  console.log("Seed complete — 37 chapter decks (Google login only):");
  console.log(`  Teacher user: ${teacherEmail} (must be in TEACHER_EMAILS)`);
  console.log(`  Chapters: Chapter 01 … Chapter ${String(CHAPTER_COUNT).padStart(2, "0")}`);
  console.log("  Placeholder students: student1@seed.local, student2@seed.local");
  console.log("  Real students sign in with Google → auto-assigned to all chapters.");
}

function formatHk(date: Date): string {
  const hk = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return hk.toISOString().slice(0, 10);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
