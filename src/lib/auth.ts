import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { assignAllDecksToStudent } from "./assign";

// On Vercel, prefer explicit NEXTAUTH_URL; fall back to https://VERCEL_URL for previews.
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

/** Comma-separated allowlist of teacher emails (case-insensitive). Everyone else is STUDENT. */
export function teacherEmailSet(): Set<string> {
  const raw = process.env.TEACHER_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function resolveRole(email: string): "TEACHER" | "STUDENT" {
  return teacherEmailSet().has(email.toLowerCase()) ? "TEACHER" : "STUDENT";
}

async function loadUserOntoToken(
  token: { id?: string; role?: "TEACHER" | "STUDENT"; email?: string | null },
  email: string,
) {
  const dbUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (dbUser) {
    token.id = dbUser.id;
    token.role = dbUser.role as "TEACHER" | "STUDENT";
    token.email = dbUser.email;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;
      const email = user.email.toLowerCase().trim();
      const role = resolveRole(email);
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const created = await prisma.user.create({
          data: {
            email,
            name: user.name?.trim() || email,
            image: user.image || null,
            role,
          },
        });
        if (role === "STUDENT") {
          await assignAllDecksToStudent(created.id);
        }
      } else {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: user.name?.trim() || existing.name,
            image: user.image ?? existing.image,
            // Keep TEACHER_EMAILS as source of truth for role
            role,
          },
        });
        // Late-joining / previously unassigned students get all chapter decks
        if (role === "STUDENT") {
          await assignAllDecksToStudent(existing.id);
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      const email =
        (typeof token.email === "string" && token.email) ||
        (profile && "email" in profile && typeof profile.email === "string"
          ? profile.email
          : undefined);
      if (email) {
        await loadUserOntoToken(token, email);
      }
      // On first Google callback, profile.email is authoritative
      if (account?.provider === "google" && profile && "email" in profile && profile.email) {
        await loadUserOntoToken(token, String(profile.email));
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TEACHER" | "STUDENT";
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};
