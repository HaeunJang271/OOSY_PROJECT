"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deletePostAsAdmin,
  fetchApprovedRecent,
  fetchPendingPosts,
  setPostStatus,
} from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import type { Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";

type Tab = "pending" | "approved";

export function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Post[]>([]);
  const [approved, setApproved] = useState<Post[]>([]);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNicknames = useCallback(async (posts: Post[]) => {
    try {
      const map = await fetchNicknamesByUids(posts.map((p) => p.authorId));
      setNicknameByUid((prev) => ({ ...prev, ...map }));
    } catch {
      // 닉네임 조회 실패 시 UID fallback
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const list = await fetchPendingPosts();
      setPending(list);
      await loadNicknames(list);
    } catch (e) {
      console.error(e);
      setError("대기 목록을 불러오지 못했습니다.");
    }
  }, [isAdmin, loadNicknames]);

  const loadApproved = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const list = await fetchApprovedRecent(50);
      setApproved(list);
      await loadNicknames(list);
    } catch (e) {
      console.error(e);
      setError("공개 글 목록을 불러오지 못했습니다.");
    }
  }, [isAdmin, loadNicknames]);

  useEffect(() => {
    if (!loading && isAdmin) {
      void loadPending();
      void loadApproved();
    }
  }, [loading, isAdmin, loadPending, loadApproved]);

  async function approve(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setPostStatus(id, "approved");
      setPending((prev) => prev.filter((p) => p.id !== id));
      await loadApproved();
    } catch (e) {
      console.error(e);
      setError("승인 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("이 글과 댓글을 삭제할까요?")) return;
    setBusy(true);
    setError(null);
    try {
      await deletePostAsAdmin(id);
      setPending((prev) => prev.filter((p) => p.id !== id));
      setApproved((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      setError("삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-700">확인 중…</p>;
  }
  if (!user) {
    return (
      <p className="text-sm text-zinc-800">
        <Link href="/login" className="font-medium text-zinc-950 underline">
          로그인
        </Link>
        이 필요합니다.
      </p>
    );
  }
  if (!isAdmin) {
    return (
      <p className="text-sm text-zinc-800">
        관리자만 접근할 수 있습니다. Firestore{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-900">admins</code> 컬렉션에 문서 ID를 본인
        계정 UID(
        <span className="break-all font-mono text-sm text-zinc-950">{user.uid}</span>)로 추가했는지 확인해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-300 bg-zinc-100/80 p-1">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`min-w-28 flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "pending"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-800"
          }`}
        >
          글 승인 대기 ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("approved")}
          className={`min-w-28 flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "approved"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-800"
          }`}
        >
          공개 글 관리
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "pending" && (
        <section className="space-y-3">
          <p className="text-sm text-zinc-800">
            승인하면 홈에 노출됩니다. 거부는 글 삭제로 처리합니다.
          </p>
          {pending.length === 0 && !error && (
            <p className="text-sm text-zinc-700">대기 중인 글이 없습니다.</p>
          )}
          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        승인 대기
                      </span>
                      <span className="text-xs text-zinc-500">
                        {p.category} · {p.region}
                      </span>
                    </div>
                    <Link
                      href={`/posts/${p.id}`}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatDate(p.createdAt)} · 작성자{" "}
                      {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => approve(p.id)}
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-[#ffffff] disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removePost(p.id)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                    >
                      거부
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "approved" && (
        <section className="space-y-3">
          <p className="text-sm text-zinc-800">
            최근 공개 글 50개입니다. 삭제 시 댓글도 함께 지워집니다.
          </p>
          {approved.length === 0 && !error && (
            <p className="text-sm text-zinc-700">공개된 글이 없습니다.</p>
          )}
          <ul className="space-y-3">
            {approved.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        공개
                      </span>
                      <span className="text-xs text-zinc-500">
                        {p.category} · {p.region}
                      </span>
                    </div>
                    <Link
                      href={`/posts/${p.id}`}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatDate(p.createdAt)} · 작성자{" "}
                      {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                    </p>
                  </div>
                  <div className="shrink-0 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removePost(p.id)}
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:opacity-50 sm:w-auto"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
