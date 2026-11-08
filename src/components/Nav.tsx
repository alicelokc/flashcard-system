"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const studentLinks = [
  { href: "/", label: "主頁 Home" },
  { href: "/", label: "Chapter" },
  { href: "/study", label: "到期 Due" },
  { href: "/unfamiliar", label: "未熟悉 Unfamiliar" },
  { href: "/leaderboard", label: "排行榜" },
  { href: "/submissions", label: "我的提交" },
];

const teacherLinks = [
  { href: "/", label: "主頁 Home" },
  { href: "/decks", label: "卡組 Decks" },
  { href: "/approvals", label: "審批 Approvals" },
  { href: "/dashboard", label: "班務 Dashboard" },
  { href: "/leaderboard", label: "排行榜" },
];

export function Nav() {
  const { data } = useSession();
  const pathname = usePathname();
  if (!data?.user) return null;
  const links = data.user.role === "TEACHER" ? teacherLinks : studentLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-700">
          🔥 FlashLearn HK
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 ${
                pathname === l.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100"
          >
            登出
          </button>
        </nav>
      </div>
    </header>
  );
}
