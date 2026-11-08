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
  archived?: boolean;
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
  const [uploadError, setUploadError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editFrontImage, setEditFrontImage] = useState<string | null>(null);
  const [editBackImage, setEditBackImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function load() {
    fetch(`/api/decks/${id}`).then((r) => r.json()).then(setDeck);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function upload(file: File, side: "front" | "back", forEdit = false) {
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error || "Upload failed");
      return;
    }
    if (data.url) {
      if (forEdit) {
        if (side === "front") setEditFrontImage(data.url);
        else setEditBackImage(data.url);
      } else if (side === "front") setFrontImage(data.url);
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
    setUploadError("");
    load();
  }

  function startEdit(c: Card) {
    setEditingId(c.id);
    setEditFront(c.frontText);
    setEditBack(c.backText);
    setEditFrontImage(c.frontImage);
    setEditBackImage(c.backImage);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setEditError("");
    const res = await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        frontText: editFront,
        backText: editBack,
        frontImage: editFrontImage,
        backImage: editBackImage,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error || "儲存失敗");
      return;
    }
    setEditingId(null);
    load();
  }

  async function archiveCard(cardId: string) {
    if (!confirm("封存此卡？溫習隊列會隱藏，但紀錄會保留。Archive this card?")) return;
    await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId, archived: true }),
    });
    if (editingId === cardId) setEditingId(null);
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
          <div className="space-y-1 text-sm">
            <label className="block">
              正面圖片（上傳 &lt;500KB）
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "front")}
              />
            </label>
            <input
              className="w-full rounded-lg border px-3 py-1.5 text-sm"
              placeholder="或貼上圖片 URL"
              value={frontImage?.startsWith("data:") ? "" : frontImage || ""}
              onChange={(e) => setFrontImage(e.target.value.trim() || null)}
            />
            {frontImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontImage} alt="" className="mt-1 h-20 object-contain" />
            )}
          </div>
          <div className="space-y-1 text-sm">
            <label className="block">
              背面圖片（上傳 &lt;500KB）
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "back")}
              />
            </label>
            <input
              className="w-full rounded-lg border px-3 py-1.5 text-sm"
              placeholder="或貼上圖片 URL"
              value={backImage?.startsWith("data:") ? "" : backImage || ""}
              onChange={(e) => setBackImage(e.target.value.trim() || null)}
            />
            {backImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backImage} alt="" className="mt-1 h-20 object-contain" />
            )}
          </div>
        </div>
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
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
            {editingId === c.id ? (
              <form onSubmit={saveEdit} className="space-y-3">
                <h3 className="text-sm font-semibold text-indigo-700">編輯閃卡 Edit card</h3>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="正面 Front"
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="背面 Back"
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  rows={3}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <label className="block">
                      正面圖片
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-sm"
                        onChange={(e) =>
                          e.target.files?.[0] && upload(e.target.files[0], "front", true)
                        }
                      />
                    </label>
                    <input
                      className="w-full rounded-lg border px-3 py-1.5 text-sm"
                      placeholder="或貼上圖片 URL"
                      value={editFrontImage?.startsWith("data:") ? "" : editFrontImage || ""}
                      onChange={(e) => setEditFrontImage(e.target.value.trim() || null)}
                    />
                    {editFrontImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editFrontImage} alt="" className="mt-1 h-16 object-contain" />
                    )}
                    {editFrontImage && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setEditFrontImage(null)}
                      >
                        移除正面圖
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <label className="block">
                      背面圖片
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-sm"
                        onChange={(e) =>
                          e.target.files?.[0] && upload(e.target.files[0], "back", true)
                        }
                      />
                    </label>
                    <input
                      className="w-full rounded-lg border px-3 py-1.5 text-sm"
                      placeholder="或貼上圖片 URL"
                      value={editBackImage?.startsWith("data:") ? "" : editBackImage || ""}
                      onChange={(e) => setEditBackImage(e.target.value.trim() || null)}
                    />
                    {editBackImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editBackImage} alt="" className="mt-1 h-16 object-contain" />
                    )}
                    {editBackImage && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setEditBackImage(null)}
                      >
                        移除背面圖
                      </button>
                    )}
                  </div>
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {saving ? "儲存中…" : "儲存 Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    取消 Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.frontText}</p>
                  <p className="text-sm text-slate-600">{c.backText}</p>
                  {(c.frontImage || c.backImage) && (
                    <div className="mt-2 flex gap-2">
                      {c.frontImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.frontImage} alt="" className="h-12 object-contain" />
                      )}
                      {c.backImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.backImage} alt="" className="h-12 object-contain" />
                      )}
                    </div>
                  )}
                  {c.submittedBy && (
                    <p className="text-xs text-slate-400">Added by {c.submittedBy.name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{c.status}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      編輯 Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveCard(c.id)}
                      className="text-sm text-slate-500 hover:underline"
                    >
                      封存 Archive
                    </button>
                  </div>
                </div>
              </div>
            )}
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
