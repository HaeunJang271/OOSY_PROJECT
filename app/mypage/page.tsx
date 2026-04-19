"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { MyPendingPosts } from "@/components/MyPendingPosts";
import { MyActivityLists } from "@/components/MyActivityLists";
import { useAuth } from "@/providers/AuthProvider";

export default function MyPage() {
  const { user, loading, isAdmin, nickname, needsNickname } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleLogout() {
    await signOut(getFirebaseAuth());
  }

  if (loading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
        <p className="text-[15px] text-[#1d1d1f]/50">확인 중…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#1d1d1f]">
          마이페이지
        </h1>
      </div>

      {/* 프로필 카드 */}
      <div
        className="rounded-xl bg-white p-4 space-y-4"
        style={{ boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d1d1f]/40">닉네임</p>
          {nickname ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold tracking-[-0.016em] text-[#1d1d1f]">{nickname}</p>
              <Link
                href="/nickname"
                className="btn-glass rounded-full px-3 py-1 text-[12px] font-medium tracking-[-0.01em] text-[#1d1d1f]/70"
              >
                변경
              </Link>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[15px] tracking-[-0.016em] text-[#1d1d1f]/50">아직 설정되지 않았습니다.</p>
              <Link
                href="/nickname"
                className="btn-glass-blue rounded-full px-3 py-1 text-[12px] font-medium text-white"
              >
                {needsNickname ? "지금 설정" : "설정"}
              </Link>
            </div>
          )}
        </div>

        {user.email && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d1d1f]/40">이메일</p>
            <p className="mt-1.5 text-[15px] tracking-[-0.016em] text-[#1d1d1f]">{user.email}</p>
          </div>
        )}

        {user.displayName && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d1d1f]/40">이름</p>
            <p className="mt-1.5 text-[15px] tracking-[-0.016em] text-[#1d1d1f]">{user.displayName}</p>
          </div>
        )}

        {isAdmin && (
          <p className="text-[13px] font-medium tracking-[-0.012em] text-[#0071e3]">관리자 계정입니다.</p>
        )}
      </div>

      <MyPendingPosts authorId={user.uid} />
      <MyActivityLists userId={user.uid} />

      <button
        type="button"
        onClick={handleLogout}
        className="btn-glass mt-8 w-full rounded-xl py-3 text-[15px] font-medium tracking-[-0.016em] text-[#1d1d1f]/70"
      >
        로그아웃
      </button>
    </div>
  );
}
