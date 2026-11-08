import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.reviewLog.deleteMany();
  await prisma.unfamiliarFlag.deleteMany();
  await prisma.cardState.deleteMany();
  await prisma.card.deleteMany();
  await prisma.deckAssignment.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.user.deleteMany();

  const teacherHash = await hash("teacher123", 10);
  const studentHash = await hash("student123", 10);

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@demo.local",
      passwordHash: teacherHash,
      name: "Alice 老師",
      role: "TEACHER",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: "student1@demo.local",
      passwordHash: studentHash,
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
      email: "student2@demo.local",
      passwordHash: studentHash,
      name: "李美華",
      role: "STUDENT",
      currentStreak: 1,
      longestStreak: 4,
      lastStudyDate: formatHk(new Date()),
      dailyGoal: 10,
    },
  });

  const deck = await prisma.deck.create({
    data: {
      title: "HKDSE Biology — Cell Structure",
      subject: "Biology",
      description: "基礎細胞結構詞彙與概念",
      createdById: teacher.id,
    },
  });

  await prisma.deckAssignment.createMany({
    data: [
      { deckId: deck.id, studentId: student1.id },
      { deckId: deck.id, studentId: student2.id },
    ],
  });

  const teacherCards = [
    { front: "Mitochondrion", back: "Powerhouse of the cell; site of aerobic respiration", order: 1 },
    { front: "Ribosome", back: "Site of protein synthesis", order: 2 },
    { front: "Nucleus", back: "Contains DNA; controls cell activities", order: 3 },
    { front: "Chloroplast", back: "Site of photosynthesis in plant cells", order: 4 },
    { front: "Cell membrane", back: "Selectively permeable barrier around the cell", order: 5 },
    { front: "Cytoplasm", back: "Jelly-like substance where organelles are suspended", order: 6 },
  ];

  const createdCards = [];
  for (const c of teacherCards) {
    const card = await prisma.card.create({
      data: {
        deckId: deck.id,
        frontText: c.front,
        backText: c.back,
        status: "APPROVED",
        sortOrder: c.order,
      },
    });
    createdCards.push(card);
  }

  // Pending student submissions
  await prisma.card.create({
    data: {
      deckId: deck.id,
      frontText: "Golgi apparatus",
      backText: "Modifies, sorts and packages proteins for secretion",
      status: "PENDING",
      submittedById: student1.id,
      sortOrder: 100,
    },
  });

  await prisma.card.create({
    data: {
      deckId: deck.id,
      frontText: "Lysosome",
      backText: "Contains digestive enzymes; breaks down waste",
      status: "PENDING",
      submittedById: student2.id,
      sortOrder: 101,
    },
  });

  // One already approved student contribution
  const approvedStudentCard = await prisma.card.create({
    data: {
      deckId: deck.id,
      frontText: "Vacuole",
      backText: "Storage sac; large central vacuole in plant cells",
      status: "APPROVED",
      submittedById: student1.id,
      reviewedById: teacher.id,
      reviewedAt: new Date(),
      sortOrder: 7,
    },
  });
  createdCards.push(approvedStudentCard);

  // Card states + review history for leaderboard demo
  const now = new Date();
  for (const student of [student1, student2]) {
    for (let i = 0; i < createdCards.length; i++) {
      const card = createdCards[i];
      const dueOffset = i < 3 ? -1 : i; // first 3 due
      await prisma.cardState.create({
        data: {
          cardId: card.id,
          studentId: student.id,
          easeFactor: 2.5,
          interval: i < 3 ? 1 : 3,
          repetitions: i < 3 ? 1 : 2,
          nextReview: subDays(now, -dueOffset),
          lastResult: 3,
        },
      });
    }
  }

  // Review logs this week
  for (let d = 0; d < 5; d++) {
    for (let r = 0; r < 4; r++) {
      await prisma.reviewLog.create({
        data: {
          cardId: createdCards[r % createdCards.length].id,
          studentId: student1.id,
          rating: r % 2 === 0 ? 3 : 4,
          reviewedAt: subDays(now, d),
        },
      });
    }
    for (let r = 0; r < 2; r++) {
      await prisma.reviewLog.create({
        data: {
          cardId: createdCards[r % createdCards.length].id,
          studentId: student2.id,
          rating: r === 0 ? 2 : 3,
          reviewedAt: subDays(now, d),
        },
      });
    }
  }

  // Unfamiliar flags
  await prisma.unfamiliarFlag.create({
    data: { cardId: createdCards[0].id, studentId: student1.id },
  });
  await prisma.unfamiliarFlag.create({
    data: { cardId: createdCards[3].id, studentId: student2.id },
  });

  console.log("Seed complete:");
  console.log("  Teacher: teacher@demo.local / teacher123");
  console.log("  Student: student1@demo.local / student123");
  console.log("  Student: student2@demo.local / student123");
}

function formatHk(date: Date): string {
  // Asia/Hong_Kong is UTC+8 year-round
  const hk = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return hk.toISOString().slice(0, 10);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
