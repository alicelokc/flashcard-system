"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProgressBar } from "@/components/ProgressBar";

type StudyCard = {
  id: string;
  frontText: string;
  backText: string;
  frontImage: string | null;
  backImage: string | null;
  contributor: string | null;
  isUnfamiliar: boolean;
};

function StudyInner() {
  const search = useSearchParams();
  const deckId = search.get("deckId");
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionTotal, setSessionTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (deckId) q.set("deckId", deckId);
    fetch(`/api/study?${q}`)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards || []);
        setSessionTotal((d.cards || []).length);
        setIdx(0);
        setFlipped(false);
        setDone(0);
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  async function rate(rating: 1 | 2 | 3 | 4) {
    const card = cards[idx];
    if (!card) return;
    await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, rating }),
    });
    setDone((d) => d + 1);
    if (idx + 1 >= cards.length) {
      setCards([]);
      return;
    }
    setIdx(idx + 1);
    setFlipped(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        void rate(Number(e.key) as 1 | 2 | 3 | 4);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, idx, cards]);

  async function toggleUnfamiliar() {
    const card = cards[idx];
    if (!card) return;
    const next = !card.isUnfamiliar;
    await fetch("/api/unfamiliar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, flagged: next }),
    });
    setCards((cs) => cs.map((c, i) => (i === idx ? { ...c, isUnfamiliar: next } : c)));
  }

  if (loading) return <p className="text-slate-500">載入溫習卡…</p>;

  if (!cards.length) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="text-xl font-semibold">今日已完成！🎉</p>
        <p className="mt-2 text-slate-500">沒有到期的卡，或本輪已溫完。</p>
        <button onClick={load} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white">
          重新整理
        </button>
      </div>
    );
  }

  const card = cards[idx];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold">溫習 Study</h1>
      <ProgressBar value={done} max={sessionTotal || 1} label="本輪進度 Session" />

      <div className="card-flip">
        <div
          className={`card-flip-inner cursor-pointer ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="card-face border bg-white shadow">
            {card.frontImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.frontImage} alt="" className="mb-3 max-h-40 object-contain" />
            )}
            <p className="text-center text-xl font-semibold">{card.frontText}</p>
            <p className="mt-3 text-xs text-slate-400">點擊或空白鍵翻面</p>
          </div>
          <div className="card-face card-back border bg-indigo-50 shadow">
            {card.backImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.backImage} alt="" className="mb-3 max-h-40 object-contain" />
            )}
            <p className="text-center text-lg">{card.backText}</p>
            {card.contributor && (
              <p className="mt-2 text-xs text-slate-500">Added by {card.contributor}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={toggleUnfamiliar} className="rounded-lg border px-3 py-2 text-sm">
          {card.isUnfamiliar ? "★ 已標未熟悉" : "☆ 標示未熟悉"}
        </button>
        <span className="text-sm text-slate-500">
          {idx + 1} / {cards.length}
        </span>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              [1, "Again", "bg-red-500"],
              [2, "Hard", "bg-orange-500"],
              [3, "Good", "bg-emerald-500"],
              [4, "Easy", "bg-sky-500"],
            ] as const
          ).map(([r, label, color]) => (
            <button
              key={r}
              onClick={() => rate(r)}
              className={`${color} rounded-xl py-3 text-sm font-medium text-white`}
            >
              {r}. {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<p>載入中…</p>}>
      <StudyInner />
    </Suspense>
  );
}
