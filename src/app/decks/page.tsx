"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deck = {
  id: string;
  title: string;
  subject: string;
  description: string;
  _count?: { cards: number; assignments: number };
};

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [description, setDescription] = useState("");

  function load() {
    fetch("/api/decks").then((r) => r.json()).then(setDecks);
  }

  useEffect(() => {
    load();
  }, []);

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, description, assignToAll: true }),
    });
    setTitle("");
    setDescription("");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">卡組 Decks</h1>

      <form onSubmit={createDeck} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">新建卡組（自動分配全班）</h2>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="科目"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          placeholder="說明"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white">
          建立
        </button>
      </form>

      <ul className="space-y-3">
        {decks.map((d) => (
          <li key={d.id}>
            <Link
              href={`/decks/${d.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm hover:border-indigo-300"
            >
              <p className="font-semibold">{d.title}</p>
              <p className="text-sm text-slate-500">
                {d.subject} · {d._count?.cards ?? "?"} 張卡 · {d._count?.assignments ?? "?"} 位學生
              </p>
              {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
