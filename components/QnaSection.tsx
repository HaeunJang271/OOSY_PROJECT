"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  addComment,
  deleteCommentTree,
  fetchCommentsForPost,
} from "@/lib/comments";
import { formatDate, shortUid, timestampMs } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";
import { MarkdownContent } from "@/components/MarkdownContent";

type Props = {
  post: Post;
  comments: Comment[];
  nicknameByUid: Record<string, string>;
  onThreadChange: (next: Comment[], nickMap: Record<string, string>) => void;
};

function buildChildrenMap(comments: Comment[]) {
  const byParent = new Map<string | null, Comment[]>();
  for (const c of comments) {
    const p = c.parentId ?? null;
    const list = byParent.get(p) ?? [];
    list.push(c);
    byParent.set(p, list);
  }
  for (const [, list] of byParent) {
    list.sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt));
  }
  return byParent;
}

type ThreadNodeProps = {
  comment: Comment;
  post: Post;
  depth: number;
  byParent: Map<string | null, Comment[]>;
  nicknameByUid: Record<string, string>;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  onSubmitReply: (parentId: string | null, text: string) => Promise<void>;
  onDeleteTree: (commentId: string) => Promise<void>;
  busyId: string | null;
  userId: string | undefined;
  isAdmin: boolean;
  /** 승인된 글 + Q&A ON일 때만 답글·답글 폼 표시 */
  canPostComments: boolean;
};

function ThreadNode({
  comment,
  post,
  depth,
  byParent,
  nicknameByUid,
  replyingToId,
  setReplyingToId,
  onSubmitReply,
  onDeleteTree,
  busyId,
  userId,
  isAdmin,
  canPostComments,
}: ThreadNodeProps) {
  const children = byParent.get(comment.id) ?? [];
  const isAuthor = comment.authorId === post.authorId;
  const isRoot = depth === 0;

  return (
    <div
      className={
        depth > 0
          ? "mt-3 border-l-2 border-emerald-200/90 pl-3 sm:pl-4"
          : "mt-4 first:mt-0"
      }
    >
      <div className="rounded-xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50/80 px-3 py-3 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              isRoot
                ? "bg-sky-100 text-sky-900"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {isRoot ? "질문" : "답변"}
          </span>
          {isAuthor && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
              글 작성자
            </span>
          )}
        </div>
        <div className="mt-2 text-sm text-neutral-950">
          <MarkdownContent markdown={comment.content} className="markdown-content text-sm leading-relaxed" />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2">
          <p className="text-xs font-medium text-neutral-600">
            {nicknameByUid[comment.authorId] ?? shortUid(comment.authorId)} ·{" "}
            {formatDate(comment.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            {canPostComments && userId && (
              <button
                type="button"
                onClick={() =>
                  setReplyingToId(replyingToId === comment.id ? null : comment.id)
                }
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
              >
                {replyingToId === comment.id ? "답글 취소" : "답글"}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                disabled={busyId === comment.id}
                onClick={() => onDeleteTree(comment.id)}
                className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {busyId === comment.id ? "삭제 중…" : "삭제"}
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingToId === comment.id && canPostComments && userId && (
        <ReplyBox
          parentId={comment.id}
          onCancel={() => setReplyingToId(null)}
          onSubmit={onSubmitReply}
        />
      )}

      {children.map((ch) => (
        <ThreadNode
          key={ch.id}
          comment={ch}
          post={post}
          depth={depth + 1}
          byParent={byParent}
          nicknameByUid={nicknameByUid}
          replyingToId={replyingToId}
          setReplyingToId={setReplyingToId}
          onSubmitReply={onSubmitReply}
          onDeleteTree={onDeleteTree}
          busyId={busyId}
          userId={userId}
          isAdmin={isAdmin}
          canPostComments={canPostComments}
        />
      ))}
    </div>
  );
}

function ReplyBox({
  parentId,
  onCancel,
  onSubmit,
  submitLabel = "답글 등록",
  showCancel = true,
}: {
  parentId: string | null;
  onCancel: () => void;
  onSubmit: (parentId: string | null, text: string) => Promise<void>;
  submitLabel?: string;
  showCancel?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await onSubmit(parentId, t);
      setText("");
      onCancel();
    } finally {
      setSending(false);
    }
  }

  function handleCancel() {
    setText("");
    onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-white p-3"
    >
      <label className="sr-only" htmlFor={`reply-${parentId ?? "root"}`}>
        답글 작성
      </label>
      <textarea
        id={`reply-${parentId ?? "root"}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
        placeholder="마크다운을 쓸 수 있어요. 짧게 답해 주세요."
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {sending ? "등록 중…" : submitLabel}
        </button>
        {showCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

export function QnaSection({
  post,
  comments,
  nicknameByUid,
  onThreadChange,
}: Props) {
  const { user, isAdmin } = useAuth();
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  const canPostComments =
    post.status === "approved" && post.commentsEnabled !== false;

  const byParent = useMemo(() => buildChildrenMap(comments), [comments]);
  const roots = byParent.get(null) ?? [];

  const refresh = useCallback(async () => {
    const list = await fetchCommentsForPost(post.id);
    const map = await fetchNicknamesByUids([
      post.authorId,
      ...list.map((c) => c.authorId),
    ]);
    onThreadChange(list, map);
  }, [post.authorId, post.id, onThreadChange]);

  const submitReply = useCallback(
    async (parentId: string | null, text: string) => {
      if (!user) return;
      setRootError(null);
      await addComment({
        postId: post.id,
        content: text,
        authorId: user.uid,
        parentId,
      });
      await refresh();
    },
    [post.id, refresh, user],
  );

  const handleDeleteTree = useCallback(
    async (commentId: string) => {
      if (!confirm("이 글과 연결된 답글까지 모두 삭제할까요?")) return;
      setBusyId(commentId);
      setRootError(null);
      try {
        await deleteCommentTree(commentId, post.id);
        await refresh();
      } catch (e) {
        console.error(e);
        setRootError("삭제에 실패했습니다.");
      } finally {
        setBusyId(null);
      }
    },
    [post.id, refresh],
  );

  return (
    <section className="border-t border-zinc-200 pt-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Q&A 스레드
          </h2>
          <p className="text-xs text-neutral-600">
            {post.status !== "approved"
              ? "글 공개 승인 후에 질문·답글을 남길 수 있어요."
              : "질문은 맨 위에, 답글은 아래로 이어집니다. 답글에 또 답글을 달 수 있어요."}
          </p>
        </div>
        <p className="text-xs font-medium text-neutral-500">
          {comments.length}개 메시지
        </p>
      </div>

      {rootError && (
        <p className="mb-3 text-sm text-red-600">{rootError}</p>
      )}

      <ul className="space-y-0">
        {roots.map((c) => (
          <li key={c.id}>
            <ThreadNode
              comment={c}
              post={post}
              depth={0}
              byParent={byParent}
              nicknameByUid={nicknameByUid}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              onSubmitReply={submitReply}
              onDeleteTree={handleDeleteTree}
              busyId={busyId}
              userId={user?.uid}
              isAdmin={isAdmin}
              canPostComments={canPostComments}
            />
          </li>
        ))}
      </ul>

      {post.status !== "approved" && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          승인 대기 중인 글에는 댓글을 달 수 없습니다. 공개 승인 후 Q&A를 이용할 수 있어요.
        </p>
      )}

      {post.status === "approved" &&
        post.commentsEnabled !== false &&
        (user ? (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-neutral-950">
              새 질문 올리기
            </h3>
            <ReplyBox
              parentId={null}
              onCancel={() => {}}
              onSubmit={async (_parentId, text) => {
                await submitReply(null, text);
              }}
              submitLabel="질문 등록"
              showCancel={false}
            />
            <p className="mt-2 text-xs text-neutral-500">
              특정 답글에 이어 달려면 위 스레드에서 해당 메시지의 「답글」을 눌러 주세요.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-800">
            질문을 남기려면{" "}
            <Link href="/login" className="font-medium text-zinc-950 underline">
              로그인
            </Link>
            해 주세요.
          </p>
        ))}

      {post.status === "approved" && post.commentsEnabled === false && (
        <p className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-neutral-800">
          작성자가 Q&A를 꺼두었습니다.
        </p>
      )}
    </section>
  );
}
