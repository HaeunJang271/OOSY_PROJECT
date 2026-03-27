"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCommentsForPost } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";
import { MarkdownContent } from "@/components/MarkdownContent";
import { QnaSection } from "@/components/QnaSection";

type Props = { postId: string };

export function PostDetail({ postId }: Props) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
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
  }, [postId, user, isAdmin]);

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
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="inline-block rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
            {post.category}
          </span>
          <span className="inline-block rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
            {post.region}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-neutral-950 sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-3 text-xs font-medium text-neutral-700">
          {formatDate(post.createdAt)} · 작성자{" "}
          {nicknameByUid[post.authorId] ?? shortUid(post.authorId)}
          {post.status === "pending" && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
              승인 대기
            </span>
          )}
        </p>
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
