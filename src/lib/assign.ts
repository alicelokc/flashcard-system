import { prisma } from "./prisma";

/** Assign every existing deck to a student and create CardStates for approved cards. */
export async function assignAllDecksToStudent(studentId: string) {
  const decks = await prisma.deck.findMany({ select: { id: true } });
  if (!decks.length) return;

  const existingAssignments = await prisma.deckAssignment.findMany({
    where: { studentId },
    select: { deckId: true },
  });
  const assigned = new Set(existingAssignments.map((a) => a.deckId));
  const missingDecks = decks.filter((d) => !assigned.has(d.id));
  if (missingDecks.length) {
    await prisma.deckAssignment.createMany({
      data: missingDecks.map((d) => ({ deckId: d.id, studentId })),
    });
  }

  const approved = await prisma.card.findMany({
    where: {
      deckId: { in: decks.map((d) => d.id) },
      status: "APPROVED",
      archived: false,
    },
    select: { id: true },
  });
  if (!approved.length) return;

  const existingStates = await prisma.cardState.findMany({
    where: { studentId, cardId: { in: approved.map((c) => c.id) } },
    select: { cardId: true },
  });
  const haveState = new Set(existingStates.map((s) => s.cardId));
  const missingCards = approved.filter((c) => !haveState.has(c.id));
  if (missingCards.length) {
    await prisma.cardState.createMany({
      data: missingCards.map((c) => ({
        cardId: c.id,
        studentId,
        nextReview: new Date(),
      })),
    });
  }
}
