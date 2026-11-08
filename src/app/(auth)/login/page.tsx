"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function loginWithGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-indigo-700">🔥 FlashLearn HK</h1>
      <p className="mt-1 text-sm text-slate-500">間隔重複閃卡 · 儲火 · 排行榜</p>
      <p className="mt-4 text-sm text-slate-600">
        請用 Google 帳戶登入。老師電郵須列入{" "}
        <code className="rounded bg-slate-100 px-1">TEACHER_EMAILS</code>
        ；其餘為學生。
      </p>
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "跳轉中…" : "使用 Google 登入 Sign in with Google"}
      </button>
    </div>
  );
}
