"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deletePostAsAdmin,
  fetchApprovedRecent,
  fetchPendingPosts,
  approvePostAndAwardAuthor,
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
import { fetchAdminStats, type AdminStats } from "@/lib/adminStats";
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
  const [stats, setStats] = useState<AdminStats | null>(null);
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

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const s = await fetchAdminStats();
      setStats(s);
    } catch (e) {
      console.error(e);
      setStats(null);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && isAdmin) {
      void loadPending();
      void loadApproved();
      void loadReports();
      void loadRewardRequests();
      void loadStats();
    }
  }, [loading, isAdmin, loadPending, loadApproved, loadReports, loadRewardRequests, loadStats]);

  async function approve(id: string) {
    setBusy(true);
    setError(null);
    try {
      await approvePostAndAwardAuthor(id);
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
    return <p className="text-sm text-muted">확인 중…</p>;
  }
  if (!user) {
    return (
      <p className="text-sm text-muted">
        <Link href="/login" className="link-inline">
          로그인
        </Link>
        이 필요합니다.
      </p>
    );
  }
  if (!isAdmin) {
    return (
      <p className="text-sm text-muted">
        관리자만 접근할 수 있습니다. Firestore{" "}
        <code className="rounded bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-foreground">admins</code> 컬렉션에 문서 ID를 본인
        계정 UID(
        <span className="break-all font-mono text-sm text-foreground">{user.uid}</span>)로 추가했는지 확인해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="admin-tab-track">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`admin-tab ${tab === "pending" ? "admin-tab-active" : "admin-tab-idle"}`}
        >
          글 승인 대기 ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("approved")}
          className={`admin-tab ${tab === "approved" ? "admin-tab-active" : "admin-tab-idle"}`}
        >
          공개 글 관리
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`admin-tab ${tab === "reports" ? "admin-tab-active" : "admin-tab-idle"}`}
        >
          신고 관리 ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rewards")}
          className={`admin-tab ${tab === "rewards" ? "admin-tab-active" : "admin-tab-idle"}`}
        >
          보상 신청 ({rewardRequests.length})
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "pending" && (
        <section className="space-y-3">
          <p className="text-sm text-muted">
            승인하면 홈에 노출됩니다. 거부는 글 삭제로 처리합니다.
          </p>
          {pending.length === 0 && !error && (
            <p className="text-sm text-muted">대기 중인 글이 없습니다.</p>
          )}
          {pending.length > 0 && (
            <ul className="list-panel divide-y divide-[color:var(--border-subtle)]">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="px-3 py-4 first:rounded-t-lg last:rounded-b-lg sm:px-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        <span className="badge-status">승인 대기</span>
                        <span className="badge">{p.category}</span>
                        <span className="badge badge-accent">{p.region}</span>
                      </div>
                      <Link
                        href={`/posts/${p.id}`}
                        className="block focus-ring rounded-sm"
                      >
                        <h2 className="text-lg font-semibold leading-snug text-foreground hover:underline">
                          {p.title}
                        </h2>
                      </Link>
                      <div className="mt-2 flex items-baseline justify-between gap-2 text-meta font-medium">
                        <span className="min-w-0 shrink">
                          {formatDate(p.createdAt)}
                        </span>
                        <span className="shrink-0 text-right text-muted">
                          {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-start gap-2 sm:pt-0.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve(p.id)}
                        className="btn-approve"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removePost(p.id)}
                        className="btn-danger"
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
          <p className="text-sm text-muted">
            최근 공개 글 50개입니다. 삭제 시 댓글도 함께 지워집니다.
          </p>
          {approved.length === 0 && !error && (
            <p className="text-sm text-muted">공개된 글이 없습니다.</p>
          )}
          <ul className="space-y-3">
            {approved.map((p) => (
              <li
                key={p.id}
                className="surface-card-pad"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="badge badge-accent">공개</span>
                      <span className="text-meta">
                        {p.category} · {p.region}
                      </span>
                    </div>
                    <Link
                      href={`/posts/${p.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-meta">
                      {formatDate(p.createdAt)} · 작성자{" "}
                      {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                    </p>
                  </div>
                  <div className="shrink-0 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removePost(p.id)}
                      className="btn-danger w-full sm:w-auto"
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
          <p className="text-sm text-muted">
            사용자 신고 내역입니다. 확인 후 처리 완료를 누르거나, 필요 시 글을 삭제하세요.
          </p>
          {reports.length === 0 && !error && (
            <p className="text-sm text-muted">처리할 신고가 없습니다.</p>
          )}
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="surface-card-pad cursor-pointer transition-colors duration-150 hover:bg-[color:var(--surface-muted)]"
                onClick={() => {
                  window.location.href = `/posts/${r.postId}?fromReport=1`;
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="badge-status">신고 접수</span>
                      <span className="text-meta">
                        postId: {r.postId}
                      </span>
                    </div>
                    <p className="text-meta">
                      신고자: {nicknameByUid[r.reporterId] ?? shortUid(r.reporterId)}
                    </p>
                    <p className="mt-1 text-meta">
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
                      className="btn-secondary text-sm disabled:opacity-50"
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
                      className="btn-danger disabled:opacity-50"
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
          <p className="text-sm text-muted">
            포인트 보상 신청 내역입니다. 확인 후 처리 완료를 눌러 주세요.
          </p>
          {rewardRequests.length === 0 && !error && (
            <p className="text-sm text-muted">처리할 신청이 없습니다.</p>
          )}
          <ul className="space-y-3">
            {rewardRequests.map((r) => (
              <li
                key={r.id}
                className="surface-card-pad"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="badge badge-accent">보상 신청</span>
                      <span className="text-meta">
                        {r.rewardName} · {r.costPoints}P
                      </span>
                    </div>
                    <p className="text-meta">
                      신청자: {nicknameByUid[r.userId] ?? shortUid(r.userId)}
                    </p>
                    <p className="mt-1 text-meta">
                      전화번호: {r.phone}
                    </p>
                    <p className="mt-1 text-meta">
                      신청일: {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void fulfillReward(r.id)}
                      className="btn-secondary text-sm disabled:opacity-50"
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

      <section className="mt-10 border-t border-[color:var(--border-subtle)] pt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">통계</h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadStats()}
            className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-50"
          >
            새로고침
          </button>
        </div>
        {!stats ? (
          <p className="text-sm text-muted">통계를 불러오지 못했습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-card-pad">
              <p className="stat-label">가입자 수</p>
              <p className="stat-value">{stats.userCount}</p>
            </div>
            <div className="surface-card-pad">
              <p className="stat-label">게시글 수</p>
              <p className="stat-value">{stats.postCount}</p>
            </div>
            <div className="surface-card-pad">
              <p className="stat-label">질문 수</p>
              <p className="stat-value">{stats.questionCount}</p>
            </div>
            <div className="surface-card-pad">
              <p className="stat-label">오늘 방문(사용) 수</p>
              <p className="stat-value">{stats.todayVisits}</p>
            </div>
            <div className="surface-card-pad">
              <p className="stat-label">일일 평균 방문(최근 30일)</p>
              <p className="stat-value">{stats.avgDailyVisits30d}</p>
            </div>
            <div className="surface-card-pad">
              <p className="stat-label">총 방문(누적)</p>
              <p className="stat-value">{stats.totalVisits}</p>
            </div>
            <div className="surface-card-pad sm:col-span-2">
              <p className="stat-label">카테고리별 게시글 수</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {Object.entries(stats.categoryCounts).map(([k, v]) => (
                  <div key={k} className="surface-inset flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{k}</span>
                    <span className="text-sm font-semibold text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
