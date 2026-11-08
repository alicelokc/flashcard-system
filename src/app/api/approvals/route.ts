import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const pending = await prisma.card.findMany({
    where: { status: "PENDING", archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      deck: { select: { id: true, title: true } },
      submittedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(pending);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { cardId, action, reason } = await req.json();
  if (!cardId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.status !== "PENDING") {
    return NextResponse.json({ error: "Not pending" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
      },
    });
    return NextResponse.json(updated);
  }

  // Approve → whole class
  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  const assignments = await prisma.deckAssignment.findMany({
    where: { deckId: card.deckId },
  });
  if (assignments.length) {
    await prisma.cardState.createMany({
      data: assignments.map((a) => ({
        cardId: card.id,
        studentId: a.studentId,
        nextReview: new Date(),
      })),
    });
  }

  return NextResponse.json(updated);
}
