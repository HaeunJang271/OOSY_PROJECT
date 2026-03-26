"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCommentsForPost, addComment, deleteComment } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";

type Props = { postId: string };

export function PostDetail({ postId }: Props) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});

  const canView =
    post &&
    (post.status === "approved" ||
      (user && post.authorId === user.uid) ||
      (user && isAdmin));

  const commentsEnabled = post?.commentsEnabled !== false;

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
        const map = await fetchNicknamesByUids([
          p.authorId,
          ...list.map((c) => c.authorId),
        ]);
        setNicknameByUid(map);
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
      const map = await fetchNicknamesByUids([
        post.authorId,
        ...list.map((c) => c.authorId),
      ]);
      setNicknameByUid(map);
    } catch (err) {
      console.error(err);
      setError("댓글 저장에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("댓글을 삭제할까요?")) return;
    setDeletingId(commentId);
    setError(null);
    try {
      await deleteComment(commentId);
      const list = comments.filter((c) => c.id !== commentId);
      setComments(list);
      const map = await fetchNicknamesByUids([
        post.authorId,
        ...list.map((c) => c.authorId),
      ]);
      setNicknameByUid(map);
    } catch (err) {
      console.error(err);
      setError("댓글 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

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
        <span className="mb-2 inline-block rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
          {post.category}
        </span>
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
      <div className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white px-4 py-5 text-base leading-[1.8] text-neutral-950 shadow-sm">
        {post.content}
      </div>

      <section className="border-t border-zinc-200 pt-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-950">
          댓글 {comments.length}
        </h2>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-neutral-950"
            >
              <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-600">
                  {nicknameByUid[c.authorId] ?? shortUid(c.authorId)} ·{" "}
                  {formatDate(c.createdAt)}
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    disabled={deletingId === c.id}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === c.id ? "삭제 중…" : "삭제"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!commentsEnabled ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-neutral-800">
            작성자가 댓글 기능을 꺼두었습니다.
          </p>
        ) : user ? (
          <form onSubmit={handleComment} className="mt-4 space-y-2">
            <label htmlFor="comment" className="sr-only">
              댓글 작성
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
              placeholder="댓글을 남겨 주세요."
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={sending || !commentText.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-[#ffffff] disabled:opacity-50"
            >
              {sending ? "등록 중…" : "댓글 등록"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-zinc-800">
            댓글을 남기려면{" "}
            <Link href="/login" className="font-medium text-zinc-950 underline">
              로그인
            </Link>
            해 주세요.
          </p>
        )}
      </section>
    </article>
  );
}
