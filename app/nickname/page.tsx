"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  setNickname,
  suggestNickname,
  validateNickname,
  type NicknameRole,
  nicknameRoleFromValue,
} from "@/lib/profile";
import { useAuth } from "@/providers/AuthProvider";

export default function NicknamePage() {
  const router = useRouter();
  const { user, loading, nickname, isAdmin, reloadProfile } = useAuth();
  const [value, setValue] = useState("");
  const [role, setRole] = useState<NicknameRole>("youth");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (nickname?.trim()) {
      setValue(nickname.trim());
      const r = nicknameRoleFromValue(nickname.trim());
      if (r) setRole(r);
      else if (isAdmin) setRole("expert");
      setInitialized(true);
      return;
    }
    if (!initialized) {
      const defaultRole: NicknameRole = isAdmin ? "expert" : "youth";
      setRole(defaultRole);
      setValue(suggestNickname(defaultRole));
      setInitialized(true);
    }
  }, [loading, user, nickname, router, isAdmin, initialized]);

  function applyRole(next: NicknameRole) {
    setRole(next);
    setValue(suggestNickname(next));
    setError(null);
  }

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
    <div className="page-shell max-w-md">
      <div className="page-header">
        <h1 className="page-title">닉네임 설정/변경</h1>
        <p className="page-lead">
        <span className="font-medium text-foreground">학교 밖 청소년</span> 또는{" "}
        <span className="font-medium text-foreground">전문가·기관</span> 유형으로
        가입하고, 접두(
        <span className="font-medium text-foreground">학밖청_</span> /{" "}
        <span className="font-medium text-foreground">전문가_</span>) 뒤에{" "}
        <span className="font-medium text-foreground">2~3자</span> 닉네임을
        붙입니다. (한글·영문·숫자) 중복된 닉네임은 사용할 수 없습니다.
        {isAdmin && (
          <>
            {" "}
            <span className="font-medium text-foreground">운영 관리자</span>는
            닉네임을 <span className="font-medium text-foreground">관리자_</span>{" "}
            형식으로도 설정할 수 있습니다.
          </>
        )}
        </p>
      </div>
      {!isAdmin && (
        <p className="notice-box-muted mb-6">
          운영 <span className="font-medium text-foreground">관리자</span> 권한이
          필요하면, 먼저 위 유형으로 가입한 뒤{" "}
          <span className="font-medium text-foreground">
            관리자에게 별도로 문의
          </span>
          해 주세요. 앱에서 바로 관리자로 등록되지는 않습니다.
        </p>
      )}
      {isAdmin && (
        <p className="notice-box-muted mb-6">
          <span className="font-medium text-foreground">관리자_</span> 닉네임은
          이미 운영 관리자로 등록된 계정에만 허용됩니다.
        </p>
      )}

      <div className="mb-4">
        <p className="label-field mb-2">표시 유형</p>
        <div
          className={`grid gap-2 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          <button
            type="button"
            onClick={() => applyRole("youth")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              role === "youth"
                ? "border-foreground bg-foreground text-white"
                : "border-[color:var(--border-input)] bg-surface text-muted hover:bg-[color:var(--surface-muted)]"
            }`}
          >
            학교 밖 청소년
            <span className="mt-0.5 block text-xs font-normal opacity-90">
              학밖청_···
            </span>
          </button>
          <button
            type="button"
            onClick={() => applyRole("expert")}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              role === "expert"
                ? "border-foreground bg-foreground text-white"
                : "border-[color:var(--border-input)] bg-surface text-muted hover:bg-[color:var(--surface-muted)]"
            }`}
          >
            전문가·기관
            <span className="mt-0.5 block text-xs font-normal opacity-90">
              전문가_···
            </span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => applyRole("admin")}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                role === "admin"
                  ? "border-foreground bg-foreground text-white"
                  : "border-[color:var(--border-input)] bg-surface text-muted hover:bg-[color:var(--surface-muted)]"
              }`}
            >
              관리자 표시
              <span className="mt-0.5 block text-xs font-normal opacity-90">
                관리자_···
              </span>
            </button>
          )}
        </div>
        <p className="mt-2 text-meta">
          유형을 바꾸면 접미사가 새로 제안됩니다. 2~3자로 직접 수정해도 됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="nickname" className="sr-only">
          닉네임
        </label>
        <input
          id="nickname"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 학밖청_가나"
          className="input-field-plain text-sm"
          maxLength={7}
          inputMode="text"
          autoComplete="off"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {busy ? "저장 중…" : "닉네임 저장"}
        </button>
      </form>
    </div>
  );
}
