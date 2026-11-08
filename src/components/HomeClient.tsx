"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

type Progress =
  | {
      role: "STUDENT";
      name: string;
      dailyGoal: number;
      reviewsToday: number;
      currentStreak: number;
      longestStreak: number;
      approvedContributions: number;
      decks: { id: string; title: string; subject: string; totalCards: number; mastery: number; due: number }[];
    }
  | {
      role: "TEACHER";
      pending: number;
      students: {
        id: string;
        name: string;
        studied: number;
        accuracy: number;
        currentStreak: number;
        backlog: number;
        unfamiliar: number;
        submitted: number;
        approved: number;
      }[];
    };

export function HomeClient({ name }: { role?: string; name: string }) {
  const [data, setData] = useState<Progress | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return <p className="text-slate-500">載入中…</p>;
  }

  if (data.role === "TEACHER") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">你好，{name} 👋</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/approvals" className="rounded-2xl border bg-amber-50 p-4 shadow-sm">
            <p className="text-sm text-amber-800">待審批 Pending</p>
            <p className="text-3xl font-bold text-amber-700">{data.pending}</p>
          </Link>
          <Link href="/dashboard" className="rounded-2xl border bg-indigo-50 p-4 shadow-sm">
            <p className="text-sm text-indigo-800">學生人數</p>
            <p className="text-3xl font-bold text-indigo-700">{data.students.length}</p>
          </Link>
          <Link href="/leaderboard" className="rounded-2xl border bg-orange-50 p-4 shadow-sm">
            <p className="text-sm text-orange-800">排行榜</p>
            <p className="text-3xl font-bold text-orange-600">🔥</p>
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">學生</th>
                <th className="px-3 py-2">溫習數</th>
                <th className="px-3 py-2">正確率</th>
                <th className="px-3 py-2">🔥</th>
                <th className="px-3 py-2">欠溫</th>
                <th className="px-3 py-2">提交/通過</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.studied}</td>
                  <td className="px-3 py-2">{s.accuracy}%</td>
                  <td className="px-3 py-2">{s.currentStreak}</td>
                  <td className="px-3 py-2">{s.backlog}</td>
                  <td className="px-3 py-2">
                    {s.submitted}/{s.approved}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">你好，{data.name} 👋</h1>
          <p className="text-slate-500">繼續儲火，保持學習節奏！</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 px-5 py-3 text-white shadow">
          <p className="text-sm opacity-90">儲火 Streak</p>
          <p className="text-3xl font-bold">🔥 {data.currentStreak}</p>
          <p className="text-xs opacity-90">最長 {data.longestStreak} 日</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <ProgressBar
          value={data.reviewsToday}
          max={data.dailyGoal}
          label="今日目標 Daily goal"
          color="bg-emerald-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/study" className="rounded-full bg-indigo-600 px-4 py-2 text-white">
          開始溫習 Study
        </Link>
        <Link href="/submissions" className="rounded-full border px-4 py-2">
          提交閃卡
        </Link>
        <Link href="/leaderboard" className="rounded-full border px-4 py-2">
          排行榜
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.decks.map((d) => (
          <Link
            key={d.id}
            href={`/study?deckId=${d.id}`}
            className="rounded-2xl border bg-white p-4 shadow-sm hover:border-indigo-300"
          >
            <h2 className="font-semibold">{d.title}</h2>
            <p className="text-xs text-slate-500">{d.subject}</p>
            <div className="mt-3">
              <ProgressBar value={d.mastery} max={100} label="掌握度 Mastery" color="bg-indigo-500" />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {d.totalCards} 張卡 · 今日到期 {d.due}
            </p>
          </Link>
        ))}
        {!data.decks.length && <p className="text-slate-500">尚未獲分配卡組。</p>}
      </div>

      <p className="text-sm text-slate-500">你已通過審批的貢獻卡：{data.approvedContributions}</p>
    </div>
  );
}
