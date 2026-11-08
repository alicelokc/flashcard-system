import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "TEACHER") {
    const decks = await prisma.deck.findMany({
      orderBy: { title: "asc" },
      include: {
        _count: { select: { cards: true, assignments: true } },
        cards: { where: { status: "APPROVED", archived: false }, select: { id: true } },
      },
    });
    return NextResponse.json(decks);
  }

  const assignments = await prisma.deckAssignment.findMany({
    where: { studentId: session.user.id },
    include: {
      deck: {
        include: {
          _count: {
            select: {
              cards: { where: { status: "APPROVED", archived: false } },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(assignments.map((a) => a.deck));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, subject, description, assignToAll } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const deck = await prisma.deck.create({
    data: {
      title: title.trim(),
      subject: subject?.trim() || "",
      description: description?.trim() || "",
      createdById: session.user.id,
    },
  });

  if (assignToAll !== false) {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" } });
    if (students.length) {
      await prisma.deckAssignment.createMany({
        data: students.map((s) => ({ deckId: deck.id, studentId: s.id })),
      });
    }
  }

  return NextResponse.json(deck);
}
