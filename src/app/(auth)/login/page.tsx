"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "無法啟動 Google 登入。請檢查 OAuth 設定。",
  OAuthCallback: "Google 回傳失敗。請確認 redirect URI 正確。",
  OAuthCreateAccount: "無法建立帳戶，請再試一次。",
  Callback: "登入回調錯誤。",
  OAuthAccountNotLinked: "此電郵已用其他方式註冊。",
  EmailSignin: "電郵登入失敗。",
  CredentialsSignin: "登入失敗。",
  SessionRequired: "請先登入。",
  AccessDenied: "存取被拒。",
  Configuration: "伺服器未設定好 Google Client ID／Secret。請聯絡老師。",
  Default: "登入失敗，請再試一次。",
};

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const search = useSearchParams();
  const errorCode = search.get("error");
  const errorMsg = errorCode
    ? ERROR_MESSAGES[errorCode] || `${ERROR_MESSAGES.Default}（${errorCode}）`
    : null;

  async function loginWithGoogle() {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-indigo-700">🔥 FlashLearn HK</h1>
      <p className="mt-1 text-sm text-slate-500">間隔重複閃卡 · Chapter 溫習 · 儲火 · 排行榜</p>
      <p className="mt-4 text-sm text-slate-600">
        請用學校／個人 Google 帳戶登入。老師帳戶由校方設定；其他帳戶會以學生身分進入 37 個
        Chapter。
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

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

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="mt-10 text-center text-slate-500">載入中…</p>}>
      <LoginInner />
    </Suspense>
  );
}
