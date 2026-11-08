"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/** Wraps teacher-only pages so students see a friendly message instead of crashing. */
export function TeacherOnly({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();

  if (status === "loading") {
    return <p className="text-slate-500">載入中…</p>;
  }
  if (!data?.user) {
    return (
      <p className="text-slate-600">
        請先 <Link href="/login" className="text-indigo-600 underline">登入</Link>。
      </p>
    );
  }
  if (data.user.role !== "TEACHER") {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold">只有老師可以使用此頁</p>
        <p className="mt-2 text-sm text-slate-500">學生請返主頁揀 Chapter 溫習。</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white">
          返回主頁
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
