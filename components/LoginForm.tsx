"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("이메일과 비밀번호(6자 이상)를 입력해 주세요.");
      return;
    }
    setBusy(true);
    const auth = getFirebaseAuth();
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace("/");
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
      if (code === "auth/email-already-in-use") {
        setError("이미 가입된 이메일입니다. 로그인을 시도해 주세요.");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError("로그인에 실패했습니다.");
      }
    } finally {
      setBusy(false);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "login"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "signup"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          회원가입
        </button>
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-zinc-600">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-zinc-600">
          비밀번호 (6자 이상)
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "처리 중…" : mode === "signup" ? "가입하기" : "로그인"}
      </button>
    </form>
  );
}
