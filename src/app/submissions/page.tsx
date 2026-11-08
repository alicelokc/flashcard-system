"use client";

import { useEffect, useState } from "react";

type Deck = { id: string; title: string };
type Card = {
  id: string;
  frontText: string;
  backText: string;
  status: string;
  rejectionReason: string | null;
  deck: { id: string; title: string };
};

export default function SubmissionsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/submissions").then((r) => r.json()).then(setCards);
    fetch("/api/decks").then((r) => r.json()).then((d) => {
      setDecks(d);
      if (d[0]) setDeckId((prev) => prev || d[0].id);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(asPending: boolean) {
    setMsg("");
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckId, frontText: front, backText: back, submit: asPending }),
    });
    if (!res.ok) {
      setMsg("提交失敗");
      return;
    }
    setFront("");
    setBack("");
    setMsg(asPending ? "已提交審批 ✅" : "已存草稿");
    load();
  }

  async function resubmit(id: string) {
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, submit: true }),
    });
    load();
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "草稿",
    PENDING: "待審批",
    APPROVED: "已通過（全班可見）",
    REJECTED: "已拒絕",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">我的提交 My Submissions</h1>

      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">新增閃卡</h2>
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={deckId}
          onChange={(e) => setDeckId(e.target.value)}
        >
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="正面 Front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          placeholder="背面 Back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={() => submit(false)}
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={!front || !back || !deckId}
          >
            存草稿
          </button>
          <button
            onClick={() => submit(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
            disabled={!front || !back || !deckId}
          >
            提交審批
          </button>
        </div>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      </div>

      <ul className="space-y-3">
        {cards.map((c) => (
          <li key={c.id} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{c.deck.title}</p>
            <p className="font-medium">{c.frontText}</p>
            <p className="text-slate-600">{c.backText}</p>
            <p className="mt-1 text-sm">
              狀態：<span className="font-semibold">{statusLabel[c.status] || c.status}</span>
            </p>
            {c.rejectionReason && (
              <p className="text-sm text-red-600">原因：{c.rejectionReason}</p>
            )}
            {(c.status === "DRAFT" || c.status === "REJECTED") && (
              <button
                onClick={() => resubmit(c.id)}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                重新提交審批
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
