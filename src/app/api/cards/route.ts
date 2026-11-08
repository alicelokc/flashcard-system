import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { deckId, frontText, backText, frontImage, backImage, submit } = body;
  if (!deckId || !frontText?.trim() || !backText?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (session.user.role === "TEACHER") {
    const card = await prisma.card.create({
      data: {
        deckId,
        frontText: frontText.trim(),
        backText: backText.trim(),
        frontImage: frontImage || null,
        backImage: backImage || null,
        status: "APPROVED",
      },
    });
    // Ensure card states for all assigned students
    const assignments = await prisma.deckAssignment.findMany({ where: { deckId } });
    if (assignments.length) {
      await prisma.cardState.createMany({
        data: assignments.map((a) => ({
          cardId: card.id,
          studentId: a.studentId,
          nextReview: new Date(),
        })),
      });
    }
    return NextResponse.json(card);
  }

  // Student
  const assigned = await prisma.deckAssignment.findUnique({
    where: { deckId_studentId: { deckId, studentId: session.user.id } },
  });
  if (!assigned) return NextResponse.json({ error: "Not assigned" }, { status: 403 });

  const card = await prisma.card.create({
    data: {
      deckId,
      frontText: frontText.trim(),
      backText: backText.trim(),
      frontImage: frontImage || null,
      backImage: backImage || null,
      status: submit ? "PENDING" : "DRAFT",
      submittedById: session.user.id,
    },
  });
  return NextResponse.json(card);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, frontText, backText, frontImage, backImage, submit, archived } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.card.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "TEACHER") {
    const card = await prisma.card.update({
      where: { id },
      data: {
        frontText: frontText?.trim() ?? existing.frontText,
        backText: backText?.trim() ?? existing.backText,
        frontImage: frontImage === undefined ? existing.frontImage : frontImage,
        backImage: backImage === undefined ? existing.backImage : backImage,
        ...(typeof archived === "boolean" ? { archived } : {}),
      },
    });
    return NextResponse.json(card);
  }

  if (existing.submittedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["DRAFT", "REJECTED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Only draft or rejected cards can be edited" },
      { status: 400 },
    );
  }

  let nextStatus: string = existing.status;
  if (submit) {
    nextStatus = "PENDING";
  } else if (existing.status === "REJECTED") {
    // Saving edits on a rejected card turns it back into a draft
    nextStatus = "DRAFT";
  }

  const card = await prisma.card.update({
    where: { id },
    data: {
      frontText: frontText?.trim() ?? existing.frontText,
      backText: backText?.trim() ?? existing.backText,
      frontImage: frontImage === undefined ? existing.frontImage : frontImage,
      backImage: backImage === undefined ? existing.backImage : backImage,
      status: nextStatus,
      rejectionReason: nextStatus === "PENDING" || nextStatus === "DRAFT" ? null : existing.rejectionReason,
    },
  });
  return NextResponse.json(card);
}
