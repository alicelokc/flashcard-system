"use client";

import { useEffect, useState } from "react";

type Entry = {
  rank: number;
  userId: string;
  name: string;
  score: number;
  currentStreak: number;
  reviewsThisWeek: number;
  approvedContributions: number;
  accuracy: number;
  isCurrentUser: boolean;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [formula, setFormula] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setFormula(d.formula || "");
      });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🏆 班排行榜 Leaderboard</h1>
      <p className="text-xs text-slate-500">分數公式：{formula}</p>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">姓名</th>
              <th className="px-3 py-2">分數</th>
              <th className="px-3 py-2">🔥</th>
              <th className="px-3 py-2">本週溫習</th>
              <th className="px-3 py-2">貢獻卡</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.userId}
                className={`border-t ${e.isCurrentUser ? "bg-indigo-50 font-semibold" : ""}`}
              >
                <td className="px-3 py-2">{e.rank}</td>
                <td className="px-3 py-2">
                  {e.name}
                  {e.isCurrentUser ? "（你）" : ""}
                </td>
                <td className="px-3 py-2">{e.score}</td>
                <td className="px-3 py-2">{e.currentStreak}</td>
                <td className="px-3 py-2">{e.reviewsThisWeek}</td>
                <td className="px-3 py-2">{e.approvedContributions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
