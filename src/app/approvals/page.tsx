"use client";

import { useEffect, useState } from "react";
import { TeacherOnly } from "@/components/TeacherOnly";

type Pending = {
  id: string;
  frontText: string;
  backText: string;
  frontImage: string | null;
  backImage: string | null;
  deck: { id: string; title: string };
  submittedBy: { name: string; email: string } | null;
};

function ApprovalsInner() {
  const [items, setItems] = useState<Pending[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  function load() {
    fetch("/api/approvals")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !Array.isArray(d)) {
          setError(d?.error || "無法載入");
          setItems([]);
          return;
        }
        setError("");
        setItems(d);
      })
      .catch(() => setError("無法載入"));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(cardId: string, action: "approve" | "reject") {
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, action, reason: reason[cardId] || "" }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">審批 Approvals</h1>
      <p className="text-sm text-slate-500">通過後該卡會加入對應 Chapter，全班都可溫習。</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!items.length && !error && <p className="text-slate-500">沒有待審批項目。</p>}
      {items.map((it) => (
        <div key={it.id} className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            {it.deck.title} · 由 {it.submittedBy?.name || "?"} 提交
          </p>
          <p className="mt-1 text-lg font-semibold">{it.frontText}</p>
          <p className="text-slate-700">{it.backText}</p>
          {(it.frontImage || it.backImage) && (
            <div className="mt-2 flex gap-2">
              {it.frontImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.frontImage} alt="" className="h-24 rounded object-contain" />
              )}
              {it.backImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.backImage} alt="" className="h-24 rounded object-contain" />
              )}
            </div>
          )}
          <input
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="拒絕原因（可選）"
            value={reason[it.id] || ""}
            onChange={(e) => setReason((r) => ({ ...r, [it.id]: e.target.value }))}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => act(it.id, "approve")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
            >
              通過 Approve
            </button>
            <button
              onClick={() => act(it.id, "reject")}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white"
            >
              拒絕 Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <TeacherOnly>
      <ApprovalsInner />
    </TeacherOnly>
  );
}
