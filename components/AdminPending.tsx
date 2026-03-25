"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchPendingPosts, setPostStatus } from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import type { Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export function AdminPending() {
  const { user, isAdmin, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const list = await fetchPendingPosts();
      setPosts(list);
    } catch (e) {
      console.error(e);
      setError("목록을 불러오지 못했습니다.");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && isAdmin) load();
  }, [loading, isAdmin, load]);

  async function approve(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setPostStatus(id, "approved");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      setError("승인 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">확인 중…</p>;
  }
  if (!user) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/login" className="underline">
          로그인
        </Link>
        이 필요합니다.
      </p>
    );
  }
  if (!isAdmin) {
    return (
      <p className="text-sm text-zinc-600">
        관리자만 접근할 수 있습니다. Firestore{" "}
        <code className="rounded bg-zinc-100 px-1">admins</code> 컬렉션에 문서 ID를 본인
        계정 UID(
        <span className="break-all">{user.uid}</span>)로 추가했는지 확인해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        승인 대기 글을 공개 상태로 바꿉니다.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {posts.length === 0 && !error && (
        <p className="text-sm text-zinc-500">대기 중인 글이 없습니다.</p>
      )}
      <ul className="divide-y divide-zinc-100">
        {posts.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/posts/${p.id}`}
                className="font-medium text-zinc-900 hover:underline"
              >
                {p.title}
              </Link>
              <p className="text-xs text-zinc-500">
                {p.category} · {formatDate(p.createdAt)} · 작성자{" "}
                {shortUid(p.authorId)}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => approve(p.id)}
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              승인
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
