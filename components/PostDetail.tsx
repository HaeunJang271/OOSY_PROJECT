"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCommentsForPost } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { isPostReportedByUser } from "@/lib/reports";
import {
  getPostReactionState,
  setPostBookmark,
  setPostLike,
} from "@/lib/reactions";
import { formatDate, shortUid } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { QnaSection } from "@/components/QnaSection";

type Props = { postId: string };
function isPermissionDeniedError(e: unknown): boolean {
  return (
    !!e &&
    typeof e === "object" &&
    "code" in e &&
    (e as { code?: string }).code === "permission-denied"
  );
}

export function PostDetail({ postId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hiddenByReport, setHiddenByReport] = useState(false);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const canView =
    post &&
    (post.status === "approved" ||
      (user && post.authorId === user.uid) ||
      (user && isAdmin));

  const load = useCallback(async () => {
    setError(null);
    setAccessDenied(false);
    setNotFound(false);
    setLoadingPost(true);
    let hasFetchedPost = false;
    try {
      const p = await fetchPostById(postId);
      hasFetchedPost = true;
      setPost(p);
      if (!p) {
        setNotFound(true);
        setComments([]);
        return;
      }
      try {
        const reaction = await getPostReactionState({
          postId: p.id,
          userId: user?.uid,
        });
        setLiked(reaction.liked);
        setBookmarked(reaction.bookmarked);
        setLikeCount(reaction.likeCount);
        setBookmarkCount(reaction.bookmarkCount);
      } catch (e) {
        console.error(e);
        setLiked(false);
        setBookmarked(false);
        setLikeCount(0);
        setBookmarkCount(0);
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
      if (hasFetchedPost) {
        setError("일부 데이터를 불러오지 못했습니다.");
      } else if (isPermissionDeniedError(e)) {
        setAccessDenied(true);
        setPost(null);
      } else {
        setError("불러오기에 실패했습니다.");
        setPost(null);
      }
      setComments([]);
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

  async function toggleLike() {
    if (!post) return;
    if (!user) {
      alert("좋아요는 로그인 후 이용할 수 있습니다.");
      return;
    }
    if (likeBusy) return;
    const prev = liked;
    const next = !prev;
    setLikeBusy(true);
    setLiked(next);
    setLikeCount((n) => (next ? n + 1 : Math.max(0, n - 1)));
    try {
      await setPostLike({
        postId: post.id,
        userId: user.uid,
        liked: next,
      });
    } catch (e) {
      console.error(e);
      setLiked(prev);
      setLikeCount((n) => (prev ? n + 1 : Math.max(0, n - 1)));
      alert(
        isPermissionDeniedError(e)
          ? "권한이 없어 좋아요를 저장할 수 없습니다. Firestore rules 배포 상태를 확인해 주세요."
          : "좋아요 처리에 실패했습니다.",
      );
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleBookmark() {
    if (!post) return;
    if (!user) {
      alert("북마크는 로그인 후 이용할 수 있습니다.");
      return;
    }
    if (bookmarkBusy) return;
    const prev = bookmarked;
    const next = !prev;
    setBookmarkBusy(true);
    setBookmarked(next);
    setBookmarkCount((n) => (next ? n + 1 : Math.max(0, n - 1)));
    try {
      await setPostBookmark({
        postId: post.id,
        userId: user.uid,
        bookmarked: next,
      });
    } catch (e) {
      console.error(e);
      setBookmarked(prev);
      setBookmarkCount((n) => (prev ? n + 1 : Math.max(0, n - 1)));
      alert(
        isPermissionDeniedError(e)
          ? "권한이 없어 북마크를 저장할 수 없습니다. Firestore rules 배포 상태를 확인해 주세요."
          : "북마크 처리에 실패했습니다.",
      );
    } finally {
      setBookmarkBusy(false);
    }
  }

  if (loadingPost) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }
  if (post === null) {
    if (error) {
      return <p className="text-sm text-red-600">{error}</p>;
    }
    if (accessDenied) {
      return (
        <div className="notice-box space-y-2">
          <p>이 글은 아직 공개되지 않았거나 접근 권한이 없습니다.</p>
          <Link href="/" className="link-inline">
            홈으로
          </Link>
        </div>
      );
    }
    if (notFound) {
      return <p className="text-sm text-muted">글을 찾을 수 없습니다.</p>;
    }
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  if (post.status !== "approved" && authLoading) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  if (hiddenByReport) {
    return (
      <div className="notice-box space-y-2">
        <p>신고한 글은 목록/상세에서 숨김 처리되었습니다.</p>
        <Link href="/" className="link-inline">
          홈으로
        </Link>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="notice-box space-y-2">
        <p>승인되지 않은 글입니다. 작성자와 관리자만 볼 수 있습니다.</p>
        <Link href="/" className="link-inline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <header className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="badge">{post.category}</span>
            <span className="badge badge-accent">{post.region}</span>
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
                  ? "h-5 w-5 text-[color:var(--text-tertiary)]"
                  : "h-5 w-5"
              }
            />
          )}
        </div>
        <h1 className="wrap-break-word text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          {post.title}
        </h1>
        <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 text-meta font-medium">
          <span className="min-w-0 shrink">{formatDate(post.createdAt)}</span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-initial">
            <span className="max-w-full truncate text-muted">
              {nicknameByUid[post.authorId] ?? shortUid(post.authorId)}
            </span>
            {post.status === "pending" && (
              <span className="badge-status">승인 대기</span>
            )}
          </div>
        </div>
      </header>
      <div className="surface-card px-5 py-6">
        <MarkdownContent markdown={post.content} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={likeBusy}
          className={`chip-btn ${liked ? "chip-btn-active" : ""}`}
        >
          좋아요 <span className="text-xs">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => void toggleBookmark()}
          disabled={bookmarkBusy}
          className={`chip-btn ${bookmarked ? "chip-btn-active" : ""}`}
        >
          북마크 <span className="text-xs">{bookmarkCount}</span>
        </button>
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
