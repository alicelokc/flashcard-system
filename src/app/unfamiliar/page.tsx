"use client";

import { useEffect, useState } from "react";

type Item = {
  flagId: string;
  cardId: string;
  frontText: string;
  backText: string;
  frontImage: string | null;
  deckTitle: string;
};

export default function UnfamiliarPage() {
  const [items, setItems] = useState<Item[]>([]);

  function load() {
    fetch("/api/unfamiliar")
      .then((r) => r.json())
      .then(setItems);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(cardId: string) {
    await fetch("/api/unfamiliar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, flagged: false }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">未熟悉 Unfamiliar</h1>
      {!items.length && <p className="text-slate-500">尚未標示任何卡。</p>}
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.flagId} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{it.deckTitle}</p>
            <p className="font-semibold">{it.frontText}</p>
            <p className="text-slate-600">{it.backText}</p>
            <button
              onClick={() => remove(it.cardId)}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              取消標示
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
