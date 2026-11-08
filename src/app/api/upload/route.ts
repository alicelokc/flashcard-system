import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Max raw file size for embedding as a data URL in Postgres (Vercel has no writable FS). */
const MAX_BYTES = 500 * 1024;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Image too large (${Math.round(file.size / 1024)}KB). Max ${MAX_BYTES / 1024}KB, or paste an image URL instead.`,
      },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "image").toLowerCase();
  const extMatch = name.match(/\.[a-z0-9]+$/);
  const ext = extMatch ? extMatch[0] : "";
  const mime =
    file.type && file.type.startsWith("image/")
      ? file.type
      : MIME[ext] || "image/jpeg";

  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
  return NextResponse.json({ url: dataUrl });
}
