import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const flags = await prisma.unfamiliarFlag.findMany({
    where: { studentId: session.user.id },
    include: {
      card: {
        include: { deck: { select: { title: true } }, submittedBy: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    flags
      .filter((f) => f.card.status === "APPROVED" && !f.card.archived)
      .map((f) => ({
        flagId: f.id,
        cardId: f.card.id,
        frontText: f.card.frontText,
        backText: f.card.backText,
        frontImage: f.card.frontImage,
        backImage: f.card.backImage,
        deckTitle: f.card.deck.title,
      }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { cardId, flagged } = await req.json();
  if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

  if (flagged === false) {
    await prisma.unfamiliarFlag.deleteMany({
      where: { cardId, studentId: session.user.id },
    });
    return NextResponse.json({ ok: true, flagged: false });
  }

  await prisma.unfamiliarFlag.upsert({
    where: { cardId_studentId: { cardId, studentId: session.user.id } },
    create: { cardId, studentId: session.user.id },
    update: {},
  });
  return NextResponse.json({ ok: true, flagged: true });
}
