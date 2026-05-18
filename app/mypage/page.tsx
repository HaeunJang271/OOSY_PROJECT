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
      <div className="page-shell">
        <p className="text-[15px] text-[color:var(--text-tertiary)]">확인 중…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">마이페이지</h1>
        <p className="page-lead">닉네임·내 글·활동을 확인합니다.</p>
      </div>

      <div className="surface-card-pad space-y-5">
        <div>
          <p className="label-section mb-0">닉네임</p>
          {nickname ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold tracking-[-0.016em] text-[#1d1d1f]">{nickname}</p>
              <Link
                href="/nickname"
                className="btn-secondary rounded-full px-3 py-1 text-[12px]"
              >
                변경
              </Link>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[15px] tracking-[-0.016em] text-[#1d1d1f]/50">아직 설정되지 않았습니다.</p>
              <Link
                href="/nickname"
                className="btn-accent text-[12px]"
              >
                {needsNickname ? "지금 설정" : "설정"}
              </Link>
            </div>
          )}
        </div>

        {user.email && (
          <div>
            <p className="label-section mb-0">이메일</p>
            <p className="mt-1.5 text-[15px] tracking-[-0.016em] text-[#1d1d1f]">{user.email}</p>
          </div>
        )}

        {user.displayName && (
          <div>
            <p className="label-section mb-0">이름</p>
            <p className="mt-1.5 text-[15px] tracking-[-0.016em] text-[#1d1d1f]">{user.displayName}</p>
          </div>
        )}

        {isAdmin && (
          <p className="text-[13px] font-medium tracking-[-0.012em] text-accent">관리자 계정입니다.</p>
        )}
      </div>

      <MyPendingPosts authorId={user.uid} />
      <MyActivityLists userId={user.uid} />

      <button
        type="button"
        onClick={handleLogout}
        className="btn-secondary mt-8 w-full py-3"
      >
        로그아웃
      </button>
    </div>
  );
}
