"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";

type Card = {
  id: string;
  frontText: string;
  backText: string;
  frontImage: string | null;
  backImage: string | null;
  status: string;
  submittedBy?: { name: string } | null;
};

type Deck = {
  id: string;
  title: string;
  subject: string;
  description: string;
  cards: Card[];
};

function DeckDetailInner() {
  const params = useParams();
  const id = params.id as string;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    fetch(`/api/decks/${id}`).then((r) => r.json()).then(setDeck);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function upload(file: File, side: "front" | "back") {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      if (side === "front") setFrontImage(data.url);
      else setBackImage(data.url);
    }
  }

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: id,
        frontText: front,
        backText: back,
        frontImage,
        backImage,
      }),
    });
    setFront("");
    setBack("");
    setFrontImage(null);
    setBackImage(null);
    load();
  }

  if (!deck) return <p>載入中…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{deck.title}</h1>
        <p className="text-sm text-slate-500">
          {deck.subject} — {deck.description}
        </p>
      </div>

      <form onSubmit={addCard} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">新增老師卡（即時通過）</h2>
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="正面"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          placeholder="背面"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            正面圖片
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "front")}
            />
            {frontImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontImage} alt="" className="mt-1 h-20 object-contain" />
            )}
          </label>
          <label className="text-sm">
            背面圖片
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "back")}
            />
            {backImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backImage} alt="" className="mt-1 h-20 object-contain" />
            )}
          </label>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        >
          加入卡組
        </button>
      </form>

      <ul className="space-y-2">
        {deck.cards.map((c) => (
          <li key={c.id} className="rounded-xl border bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.frontText}</p>
                <p className="text-sm text-slate-600">{c.backText}</p>
                {c.submittedBy && (
                  <p className="text-xs text-slate-400">Added by {c.submittedBy.name}</p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{c.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DeckDetailPage() {
  return (
    <Suspense fallback={<p>載入中…</p>}>
      <DeckDetailInner />
    </Suspense>
  );
}
