import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cards = await prisma.card.findMany({
    where: { submittedById: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { deck: { select: { id: true, title: true } } },
  });
  return NextResponse.json(cards);
}
