"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCommentsForPost } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { isPostReportedByUser } from "@/lib/reports";
import { formatDate, shortUid } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { QnaSection } from "@/components/QnaSection";

type Props = { postId: string };

export function PostDetail({ postId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hiddenByReport, setHiddenByReport] = useState(false);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});

  const canView =
    post &&
    (post.status === "approved" ||
      (user && post.authorId === user.uid) ||
      (user && isAdmin));

  const load = useCallback(async () => {
    setError(null);
    setLoadingPost(true);
    try {
      const p = await fetchPostById(postId);
      setPost(p);
      if (!p) {
        setComments([]);
        return;
      }
      const fromReport = searchParams.get("fromReport") === "1";
      const canBypassHidden = Boolean(isAdmin && fromReport);
      if (user && p.status === "approved" && !canBypassHidden) {
        const reported = await isPostReportedByUser({
          postId: p.id,
          reporterId: user.uid,
        });
        setHiddenByReport(reported);
        if (reported) {
          setComments([]);
          setNicknameByUid({});
          return;
        }
      } else {
        setHiddenByReport(false);
      }
      const viewer =
        p.status === "approved" ||
        (user && p.authorId === user.uid) ||
        (user && isAdmin);
      if (viewer) {
        if (p.status === "pending") {
          setComments([]);
          const map = await fetchNicknamesByUids([p.authorId]);
          setNicknameByUid(map);
        } else {
          const list = await fetchCommentsForPost(postId);
          setComments(list);
          const map = await fetchNicknamesByUids([
            p.authorId,
            ...list.map((c) => c.authorId),
          ]);
          setNicknameByUid(map);
        }
      } else {
        setComments([]);
        setNicknameByUid({});
      }
    } catch (e) {
      console.error(e);
      setError("불러오기에 실패했습니다.");
      setPost(null);
      setNicknameByUid({});
    } finally {
      setLoadingPost(false);
    }
  }, [postId, user, isAdmin, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleThreadChange = useCallback(
    (next: Comment[], nickMap: Record<string, string>) => {
      setComments(next);
      setNicknameByUid((prev) => ({ ...prev, ...nickMap }));
    },
    [],
  );

  if (loadingPost) {
    return <p className="text-sm text-zinc-700">불러오는 중…</p>;
  }
  if (post === null) {
    return <p className="text-sm text-zinc-800">글을 찾을 수 없습니다.</p>;
  }

  if (post.status !== "approved" && authLoading) {
    return <p className="text-sm text-zinc-700">불러오는 중…</p>;
  }

  if (hiddenByReport) {
    return (
      <div className="space-y-2 rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-800">
        <p>신고한 글은 목록/상세에서 숨김 처리되었습니다.</p>
        <Link href="/" className="font-medium text-zinc-950 underline">
          홈으로
        </Link>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-2 rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-800">
        <p>승인되지 않은 글입니다. 작성자와 관리자만 볼 수 있습니다.</p>
        <Link href="/" className="font-medium text-zinc-950 underline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <header>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="inline-block rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
              {post.category}
            </span>
            <span className="inline-block rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
              {post.region}
            </span>
          </div>
          {(post.status === "approved" ||
            (user && post.authorId === user.uid)) && (
            <PostActionsMenu
              postId={post.id}
              authorId={post.authorId}
              showEdit={post.status === "pending"}
              canDelete={Boolean(user && post.authorId === user.uid)}
              showReport={post.status === "approved"}
              reporterId={user?.uid}
              onDeleted={() => router.push("/")}
              onReported={() => router.push("/")}
              triggerClassName={
                post.status === "approved"
                  ? "h-5 w-5 text-zinc-600 hover:bg-zinc-100"
                  : "h-5 w-5"
              }
            />
          )}
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-neutral-950 sm:text-3xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs font-medium text-neutral-700">
          <span className="min-w-0 shrink">{formatDate(post.createdAt)}</span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-initial">
            <span className="shrink-0 text-neutral-800">
              {nicknameByUid[post.authorId] ?? shortUid(post.authorId)}
            </span>
            {post.status === "pending" && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                승인 대기
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-5 shadow-sm">
        <MarkdownContent markdown={post.content} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <QnaSection
        post={post}
        comments={comments}
        nicknameByUid={nicknameByUid}
        onThreadChange={handleThreadChange}
      />
    </article>
  );
}
