import { describe, it, expect } from "vitest";

/**
 * Pure helpers mirroring study-queue filtering rules used by the API.
 */
function studyableCards(
  cards: { id: string; status: string; archived?: boolean }[]
) {
  return cards.filter((c) => c.status === "APPROVED" && !c.archived);
}

function visibleToClassmatesOnApprove(
  card: { status: string; deckId: string },
  assignments: { deckId: string; studentId: string }[]
) {
  if (card.status !== "APPROVED") return [];
  return assignments.filter((a) => a.deckId === card.deckId).map((a) => a.studentId);
}

describe("approval / study queue rules", () => {
  it("pending cards never appear in study queue", () => {
    const cards = [
      { id: "1", status: "APPROVED" },
      { id: "2", status: "PENDING" },
      { id: "3", status: "REJECTED" },
      { id: "4", status: "DRAFT" },
    ];
    const queue = studyableCards(cards);
    expect(queue.map((c) => c.id)).toEqual(["1"]);
    expect(queue.every((c) => c.status === "APPROVED")).toBe(true);
  });

  it("approved student cards are visible to all assigned classmates", () => {
    const card = { status: "APPROVED", deckId: "deck1" };
    const assignments = [
      { deckId: "deck1", studentId: "s1" },
      { deckId: "deck1", studentId: "s2" },
      { deckId: "deck2", studentId: "s3" },
    ];
    expect(visibleToClassmatesOnApprove(card, assignments)).toEqual(["s1", "s2"]);
  });

  it("pending cards are not class-visible", () => {
    const card = { status: "PENDING", deckId: "deck1" };
    expect(
      visibleToClassmatesOnApprove(card, [{ deckId: "deck1", studentId: "s1" }])
    ).toEqual([]);
  });
});
