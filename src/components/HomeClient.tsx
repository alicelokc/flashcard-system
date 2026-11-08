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
      totalDue: number;
      decks: {
        id: string;
        title: string;
        subject: string;
        description?: string;
        totalCards: number;
        mastery: number;
        due: number;
        newCount?: number;
      }[];
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
          <Link href="/decks" className="rounded-2xl border bg-emerald-50 p-4 shadow-sm">
            <p className="text-sm text-emerald-800">Chapter 卡組</p>
            <p className="text-3xl font-bold text-emerald-700">📚</p>
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

  const dueChapters = data.decks.filter((d) => d.due > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">你好，{data.name} 👋</h1>
          <p className="text-slate-500">揀一個 Chapter 開始溫；到期卡會按遺忘曲線推返嚟。</p>
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

      {data.totalDue > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="font-semibold text-amber-900">
              今日到期 {data.totalDue} 張 · {dueChapters} 個 Chapter
            </p>
            <p className="text-sm text-amber-800">
              SM-2 遺忘曲線：到期卡已推返對應 Chapter，撳入去溫就得。
            </p>
          </div>
          <Link
            href="/study"
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            溫習全部到期
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          今日暫時冇到期卡。你可以點任何 Chapter 睇內容／練習（若有新卡會一齊出現）。
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/submissions" className="rounded-full border px-4 py-2 text-sm">
          提交閃卡
        </Link>
        <Link href="/leaderboard" className="rounded-full border px-4 py-2 text-sm">
          排行榜
        </Link>
        <Link href="/unfamiliar" className="rounded-full border px-4 py-2 text-sm">
          未熟悉
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Chapter 卡組（共 {data.decks.length}）</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.decks.map((d) => {
            const hasDue = d.due > 0;
            return (
              <Link
                key={d.id}
                href={`/study?deckId=${d.id}`}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:border-indigo-400 ${
                  hasDue ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{d.title}</h3>
                  {hasDue ? (
                    <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      到期 {d.due}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      0 到期
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{d.subject || "Biology"}</p>
                <div className="mt-3">
                  <ProgressBar value={d.mastery} max={100} label="掌握度 Mastery" color="bg-indigo-500" />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {d.totalCards} 張卡
                  {(d.newCount ?? 0) > 0 ? ` · 新 ${d.newCount}` : ""}
                </p>
                <p className="mt-2 text-sm font-medium text-indigo-600">點擊溫習此 Chapter →</p>
              </Link>
            );
          })}
          {!data.decks.length && (
            <p className="text-slate-500">尚未獲分配 Chapter。請用 Google 重新登入，或請老師建立卡組。</p>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500">你已通過審批的貢獻卡：{data.approvedContributions}</p>
    </div>
  );
}
