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
      <div className="page-shell">
        <p className="text-[15px] text-[color:var(--text-tertiary)]">확인 중…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="page-shell pb-16">
      <div className="page-header">
        <h1 className="page-title">글쓰기</h1>
        <p className="page-lead">
          제출 후 관리자 승인이 있으면 홈에 공개됩니다.
        </p>
      </div>
      <WritePostForm />
    </div>
  );
}
