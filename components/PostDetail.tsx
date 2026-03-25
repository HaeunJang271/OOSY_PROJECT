"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCommentsForPost, addComment } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

type Props = { postId: string };

export function PostDetail({ postId }: Props) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const list = await fetchCommentsForPost(postId);
        setComments(list);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error(e);
      setError("불러오기에 실패했습니다.");
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  }, [postId, user, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !post || !canView) return;
    const t = commentText.trim();
    if (!t) return;
    setSending(true);
    setError(null);
    try {
      await addComment({ postId, content: t, authorId: user.uid });
      setCommentText("");
      const list = await fetchCommentsForPost(postId);
      setComments(list);
    } catch (err) {
      console.error(err);
      setError("댓글 저장에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  if (loadingPost) {
    return <p className="text-sm text-zinc-500">불러오는 중…</p>;
  }
  if (post === null) {
    return <p className="text-sm text-zinc-600">글을 찾을 수 없습니다.</p>;
  }

  if (post.status !== "approved" && authLoading) {
    return <p className="text-sm text-zinc-500">불러오는 중…</p>;
  }

  if (!canView) {
    return (
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p>승인되지 않은 글입니다. 작성자와 관리자만 볼 수 있습니다.</p>
        <Link href="/" className="text-zinc-900 underline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <header>
        <span className="mb-2 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {post.category}
        </span>
        <h1 className="text-xl font-semibold text-zinc-900">{post.title}</h1>
        <p className="mt-2 text-xs text-zinc-400">
          {formatDate(post.createdAt)} · 작성자 {shortUid(post.authorId)}
          {post.status === "pending" && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
              승인 대기
            </span>
          )}
        </p>
      </header>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
        {post.content}
      </div>

      <section className="border-t border-zinc-100 pt-6">
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          댓글 {comments.length}
        </h2>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
            >
              <p className="whitespace-pre-wrap">{c.content}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {shortUid(c.authorId)} · {formatDate(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>

        {user ? (
          <form onSubmit={handleComment} className="mt-4 space-y-2">
            <label htmlFor="comment" className="sr-only">
              댓글 작성
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
              placeholder="댓글을 남겨 주세요."
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={sending || !commentText.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {sending ? "등록 중…" : "댓글 등록"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            댓글을 남기려면{" "}
            <Link href="/login" className="underline">
              로그인
            </Link>
            해 주세요.
          </p>
        )}
      </section>
    </article>
  );
}
