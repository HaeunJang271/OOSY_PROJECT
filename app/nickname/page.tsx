"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setNickname, validateNickname } from "@/lib/profile";
import { useAuth } from "@/providers/AuthProvider";

export default function NicknamePage() {
  const router = useRouter();
  const { user, loading, nickname, isAdmin, reloadProfile } = useAuth();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    setValue(nickname ?? "");
  }, [loading, user, nickname, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const t = value.trim();
    const validationError = validateNickname(t, isAdmin);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      await setNickname({ uid: user.uid, nickname: t, isAdmin });
      await reloadProfile();
      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "닉네임 설정에 실패했습니다.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md flex-1 px-4 py-10">
      <h1 className="mb-2 text-xl font-semibold text-neutral-950">
        닉네임 설정/변경
      </h1>
      <p className="mb-6 text-sm text-neutral-800">
        닉네임은 중복될 수 없고, 특수문자는 사용할 수 없습니다. (공백,
        언더바는 가능)
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="nickname" className="sr-only">
          닉네임
        </label>
        <input
          id="nickname"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="2~12자 (한글/영문/숫자/_/공백)"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
          maxLength={12}
          inputMode="text"
          autoComplete="off"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-[#ffffff] disabled:opacity-50"
        >
          {busy ? "저장 중…" : "닉네임 저장"}
        </button>
      </form>
    </div>
  );
}

