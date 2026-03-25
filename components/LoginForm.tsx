"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[AUTH][LoginForm] mount");
    if (!loading && user) {
      console.log("[AUTH][LoginForm] already signed-in, redirecting home", {
        uid: user.uid,
        provider: user.providerData?.[0]?.providerId ?? null,
      });
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log("[AUTH][LoginForm] getRedirectResult start");
    getRedirectResult(auth)
      .then((result) => {
        console.log("[AUTH][LoginForm] getRedirectResult ok", {
          hasResult: Boolean(result),
          hasUser: Boolean(result?.user),
          uid: result?.user?.uid ?? null,
          provider: result?.user?.providerData?.[0]?.providerId ?? null,
        });
      })
      .catch((err: unknown) => {
      // 리다이렉트 흐름이 아닌 경우에도 호출될 수 있으므로, 치명적 오류만 노출
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      console.error("[AUTH][LoginForm] getRedirectResult error", { code });
      if (code && code !== "auth/no-auth-event") {
        setError("로그인 결과 처리에 실패했습니다. 다시 시도해 주세요.");
      }
    });
  }, []);

  async function handleKakaoLogin() {
    console.log("[AUTH][LoginForm] click kakao login");
    setError(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    const provider = new OAuthProvider("oidc.kakao");
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log("[AUTH][LoginForm] signInWithPopup start", {
        providerId: provider.providerId,
      });
      await signInWithPopup(auth, provider);
      console.log("[AUTH][LoginForm] signInWithPopup ok");
      return;
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      console.warn("[AUTH][LoginForm] popup failed, fallback redirect", { code });
      console.log("[AUTH][LoginForm] signInWithRedirect start", {
        providerId: provider.providerId,
      });
      await signInWithRedirect(auth, provider);
      return;
    }
    // redirect 시작 후에는 현재 페이지를 떠나므로 상태 변경이 필요 없습니다.
  }

  if (loading) {
    return <p className="text-sm text-zinc-700">확인 중…</p>;
  }
  if (user) {
    return (
      <p className="text-sm text-zinc-800">
        로그인되었습니다. 홈으로 이동 중…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-800">
        카카오 계정으로만 로그인할 수 있습니다.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={busy}
        className="w-full rounded-lg bg-[#FEE500] py-3 text-sm font-semibold text-zinc-950 ring-1 ring-black/10 disabled:opacity-50"
      >
        {busy ? "이동 중…" : "카카오로 로그인"}
      </button>
    </div>
  );
}
