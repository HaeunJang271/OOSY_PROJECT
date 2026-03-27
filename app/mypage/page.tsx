"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { MyPendingPosts } from "@/components/MyPendingPosts";
import { useAuth } from "@/providers/AuthProvider";

export default function MyPage() {
  const { user, loading, isAdmin, nickname, needsNickname } = useAuth();

  async function handleLogout() {
    await signOut(getFirebaseAuth());
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm text-neutral-700">확인 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-2 text-xl font-semibold text-neutral-950">마이페이지</h1>
        <p className="mb-6 text-sm text-neutral-800">
          로그인하면 내 정보를 확인할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-[#ffffff]"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-neutral-950">마이페이지</h1>
      <div className="w-full space-y-4 rounded-lg border border-zinc-200 bg-white p-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">닉네임</p>
          {nickname ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-950">{nickname}</p>
              <Link
                href="/nickname"
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 hover:bg-zinc-50"
              >
                변경
              </Link>
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-neutral-800">아직 설정되지 않았습니다.</p>
              <Link
                href="/nickname"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-[#ffffff]"
              >
                {needsNickname ? "지금 설정" : "설정"}
              </Link>
            </div>
          )}
        </div>
        {user.email && (
          <div>
            <p className="text-xs font-medium text-neutral-500">이메일</p>
            <p className="mt-1 text-sm text-neutral-900">{user.email}</p>
          </div>
        )}
        {user.displayName && (
          <div>
            <p className="text-xs font-medium text-neutral-500">이름</p>
            <p className="mt-1 text-sm text-neutral-900">{user.displayName}</p>
          </div>
        )}
        {isAdmin && (
          <p className="text-sm font-medium text-amber-800">관리자 계정입니다.</p>
        )}
      </div>

      <MyPendingPosts authorId={user.uid} />

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 w-full rounded-lg border border-zinc-300 bg-white py-3 text-sm font-medium text-neutral-900 hover:bg-zinc-50"
      >
        로그아웃
      </button>
    </div>
  );
}
