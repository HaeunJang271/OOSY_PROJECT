"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WritePostForm } from "@/components/WritePostForm";
import { useAuth } from "@/providers/AuthProvider";

export default function WritePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
        <p className="text-[15px] text-[#1d1d1f]/50">확인 중…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 pt-8 pb-16">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#1d1d1f]">
          글쓰기
        </h1>
        <p className="mt-3 text-[15px] leading-[1.47] tracking-[-0.016em] text-[#1d1d1f]/60">
          제출 후 관리자 승인이 있으면 홈에 공개됩니다.
        </p>
      </div>
      <WritePostForm />
    </div>
  );
}
