"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeacherOnly } from "@/components/TeacherOnly";

type Student = {
  id: string;
  name: string;
  email: string;
  studied: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  backlog: number;
  unfamiliar: number;
  submitted: number;
  approved: number;
  lastStudyDate: string | null;
};

function DashboardInner() {
  const [pending, setPending] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => {
        if (d.role === "TEACHER") {
          setPending(d.pending);
          setStudents(d.students || []);
        }
      });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">班務 Dashboard</h1>
      <div className="flex flex-wrap gap-3">
        <Link href="/approvals" className="rounded-xl bg-amber-100 px-4 py-3 text-amber-900">
          待審批：{pending}
        </Link>
        <Link href="/leaderboard" className="rounded-xl bg-orange-100 px-4 py-3 text-orange-900">
          排行榜 🔥
        </Link>
        <Link href="/decks" className="rounded-xl bg-indigo-100 px-4 py-3 text-indigo-900">
          管理卡組
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">學生</th>
              <th className="px-3 py-2">溫習</th>
              <th className="px-3 py-2">正確率</th>
              <th className="px-3 py-2">🔥 現在</th>
              <th className="px-3 py-2">最長</th>
              <th className="px-3 py-2">欠溫</th>
              <th className="px-3 py-2">未熟悉</th>
              <th className="px-3 py-2">提交/通過</th>
              <th className="px-3 py-2">上次溫習</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </td>
                <td className="px-3 py-2">{s.studied}</td>
                <td className="px-3 py-2">{s.accuracy}%</td>
                <td className="px-3 py-2">{s.currentStreak}</td>
                <td className="px-3 py-2">{s.longestStreak}</td>
                <td className="px-3 py-2">{s.backlog}</td>
                <td className="px-3 py-2">{s.unfamiliar}</td>
                <td className="px-3 py-2">
                  {s.submitted}/{s.approved}
                </td>
                <td className="px-3 py-2">{s.lastStudyDate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <TeacherOnly>
      <DashboardInner />
    </TeacherOnly>
  );
}
