import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deck = await prisma.deck.findUnique({
    where: { id: params.id },
    include: {
      cards: {
        where:
          session.user.role === "TEACHER"
            ? { archived: false }
            : { status: "APPROVED", archived: false },
        orderBy: { sortOrder: "asc" },
        include: {
          submittedBy: { select: { id: true, name: true } },
        },
      },
      assignments: { include: { student: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "STUDENT") {
    const assigned = await prisma.deckAssignment.findUnique({
      where: { deckId_studentId: { deckId: deck.id, studentId: session.user.id } },
    });
    if (!assigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(deck);
}
