"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OAuthProvider, signInWithRedirect } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKakaoLogin() {
    setError(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    const provider = new OAuthProvider("oidc.kakao");
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code === "auth/operation-not-allowed") {
        setError("Firebase Auth에서 OIDC(Kakao) 제공업체를 먼저 활성화해 주세요.");
      } else {
        setError("카카오 로그인에 실패했습니다.");
      }
      setBusy(false);
      return;
    } finally {
      // redirect 시작 후에는 현재 페이지를 떠나므로 상태 변경이 필요 없습니다.
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">확인 중…</p>;
  }
  if (user) {
    return (
      <p className="text-sm text-zinc-600">
        이미 로그인되어 있습니다.{" "}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-zinc-900 underline"
        >
          홈으로
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        카카오 계정으로만 로그인할 수 있습니다.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={busy}
        className="w-full rounded-lg bg-[#FEE500] py-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
      >
        {busy ? "이동 중…" : "카카오로 로그인"}
      </button>
    </div>
  );
}
