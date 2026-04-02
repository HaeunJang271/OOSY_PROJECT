"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deletePostAsAdmin,
  fetchApprovedRecent,
  fetchPendingPosts,
  setPostStatus,
} from "@/lib/posts";
import {
  fetchPostReports,
  resolvePostReport,
  type PostReport,
} from "@/lib/reports";
import {
  fetchOpenRewardRequests,
  fulfillRewardRequest,
  type RewardRequest,
} from "@/lib/rewardRequests";
import { formatDate, shortUid } from "@/lib/format";
import type { Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";

type Tab = "pending" | "approved" | "reports" | "rewards";

export function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Post[]>([]);
  const [approved, setApproved] = useState<Post[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
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

  const loadReports = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const list = await fetchPostReports(100);
      setReports(list.filter((r) => r.status === "open"));
      try {
        const map = await fetchNicknamesByUids(list.map((r) => r.reporterId));
        setNicknameByUid((prev) => ({ ...prev, ...map }));
      } catch {
        // 신고자 닉네임 조회 실패 시 UID fallback
      }
    } catch (e) {
      console.error(e);
      setError("신고 목록을 불러오지 못했습니다.");
    }
  }, [isAdmin]);

  const loadRewardRequests = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const list = await fetchOpenRewardRequests(200);
      setRewardRequests(list);
      try {
        const map = await fetchNicknamesByUids(list.map((r) => r.userId));
        setNicknameByUid((prev) => ({ ...prev, ...map }));
      } catch {
        // ignore
      }
    } catch (e) {
      console.error(e);
      setError("보상 신청 목록을 불러오지 못했습니다.");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && isAdmin) {
      void loadPending();
      void loadApproved();
      void loadReports();
      void loadRewardRequests();
    }
  }, [loading, isAdmin, loadPending, loadApproved, loadReports, loadRewardRequests]);

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
      // 신고 관리 탭에서도 즉시 반영되도록, 해당 글 신고 카드를 함께 제거
      setReports((prev) => prev.filter((r) => r.postId !== id));
    } catch (e) {
      console.error(e);
      setError("삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveReport(reportId: string) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await resolvePostReport({ reportId, resolverId: user.uid });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error(e);
      setError("신고 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function fulfillReward(id: string) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await fulfillRewardRequest({ requestId: id, adminId: user.uid });
      setRewardRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
      setError("보상 처리에 실패했습니다.");
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
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`min-w-28 flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "reports"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-800"
          }`}
        >
          신고 관리 ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rewards")}
          className={`min-w-28 flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "rewards"
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-800"
          }`}
        >
          보상 신청 ({rewardRequests.length})
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
          {pending.length > 0 && (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="px-3 py-4 first:rounded-t-lg last:rounded-b-lg sm:px-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          승인 대기
                        </span>
                        <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                          {p.category}
                        </span>
                        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
                          {p.region}
                        </span>
                      </div>
                      <Link
                        href={`/posts/${p.id}`}
                        className="block outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-zinc-400"
                      >
                        <h2 className="text-lg font-semibold leading-snug text-neutral-950 hover:underline">
                          {p.title}
                        </h2>
                      </Link>
                      <div className="mt-2 flex items-baseline justify-between gap-2 text-xs font-medium text-neutral-600">
                        <span className="min-w-0 shrink">
                          {formatDate(p.createdAt)}
                        </span>
                        <span className="shrink-0 text-right text-neutral-700">
                          {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-start gap-2 sm:pt-0.5">
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
          )}
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

      {tab === "reports" && (
        <section className="space-y-3">
          <p className="text-sm text-zinc-800">
            사용자 신고 내역입니다. 확인 후 처리 완료를 누르거나, 필요 시 글을 삭제하세요.
          </p>
          {reports.length === 0 && !error && (
            <p className="text-sm text-zinc-700">처리할 신고가 없습니다.</p>
          )}
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50"
                onClick={() => {
                  window.location.href = `/posts/${r.postId}?fromReport=1`;
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900">
                        신고 접수
                      </span>
                      <span className="text-xs text-zinc-500">
                        postId: {r.postId}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      신고자: {nicknameByUid[r.reporterId] ?? shortUid(r.reporterId)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      신고 유형: {r.reportType}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void resolveReport(r.id);
                      }}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 disabled:opacity-50"
                    >
                      처리 완료
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void removePost(r.postId);
                      }}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                    >
                      글 삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "rewards" && (
        <section className="space-y-3">
          <p className="text-sm text-zinc-800">
            포인트 보상 신청 내역입니다. 확인 후 처리 완료를 눌러 주세요.
          </p>
          {rewardRequests.length === 0 && !error && (
            <p className="text-sm text-zinc-700">처리할 신청이 없습니다.</p>
          )}
          <ul className="space-y-3">
            {rewardRequests.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">
                        보상 신청
                      </span>
                      <span className="text-xs text-zinc-500">
                        {r.rewardName} · {r.costPoints}P
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      신청자: {nicknameByUid[r.userId] ?? shortUid(r.userId)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      전화번호: {r.phone}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      신청일: {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void fulfillReward(r.id)}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 disabled:opacity-50"
                    >
                      처리 완료
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
