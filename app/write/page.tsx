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
      <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm text-zinc-500">확인 중…</p>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">글쓰기</h1>
      <WritePostForm />
    </div>
  );
}
