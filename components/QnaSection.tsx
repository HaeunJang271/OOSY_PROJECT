"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addComment,
  collectSubtreeIds,
  deleteCommentTree,
  fetchCommentsForPost,
  updateComment,
} from "@/lib/comments";
import { formatDate, shortUid, timestampMs } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { fetchNicknamesByUids } from "@/lib/profile";
import { CommentActionsMenu } from "@/components/CommentActionsMenu";
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
  onCommentDelete: (comment: Comment) => Promise<void>;
  onSaveCommentEdit: (comment: Comment, content: string) => Promise<void>;
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
  onCommentDelete,
  onSaveCommentEdit,
  busyId,
  userId,
  isAdmin,
  canPostComments,
}: ThreadNodeProps) {
  const children = byParent.get(comment.id) ?? [];
  const isAuthor = comment.authorId === post.authorId;
  const isRoot = depth === 0;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  useEffect(() => {
    if (!editing) {
      setEditText(comment.content);
    }
  }, [comment.content, comment.id, editing]);

  const isCommentAuthor = Boolean(userId && comment.authorId === userId);
  const canModDelete =
    Boolean(userId) && (isAdmin || post.authorId === userId);
  const showCommentEdit = isCommentAuthor;
  const showCommentDelete = isCommentAuthor || canModDelete;

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const t = editText.trim();
    if (!t || busyId === comment.id) return;
    try {
      await onSaveCommentEdit(comment, t);
      setEditing(false);
    } catch {
      /* onSaveCommentEdit가 실패 시 에러는 상위에서 표시 */
    }
  }

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
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2">
              <label className="sr-only" htmlFor={`edit-${comment.id}`}>
                댓글 수정
              </label>
              <textarea
                id={`edit-${comment.id}`}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                disabled={busyId === comment.id}
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 disabled:opacity-50"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busyId === comment.id || !editText.trim()}
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busyId === comment.id ? "저장 중…" : "저장"}
                </button>
                <button
                  type="button"
                  disabled={busyId === comment.id}
                  onClick={() => {
                    setEditText(comment.content);
                    setEditing(false);
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <MarkdownContent
              markdown={comment.content}
              className="markdown-content text-sm leading-relaxed"
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2">
          <p className="text-xs font-medium text-neutral-600">
            {nicknameByUid[comment.authorId] ?? shortUid(comment.authorId)} ·{" "}
            {formatDate(comment.createdAt)}
            {comment.updatedAt ? (
              <span className="text-neutral-400"> · 수정됨</span>
            ) : null}
          </p>
          {!editing && (
            <div className="flex flex-wrap items-center gap-2">
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
              <CommentActionsMenu
                showEdit={showCommentEdit}
                showDelete={showCommentDelete}
                onEdit={() => {
                  setEditText(comment.content);
                  setEditing(true);
                }}
                onDelete={() => onCommentDelete(comment)}
                deleting={busyId === comment.id}
              />
            </div>
          )}
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
          onCommentDelete={onCommentDelete}
          onSaveCommentEdit={onSaveCommentEdit}
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

  const handleCommentDelete = useCallback(
    async (comment: Comment) => {
      if (!user) return;
      const uid = user.uid;
      const children = byParent.get(comment.id) ?? [];
      const isAuthor = comment.authorId === uid;
      const canMod = isAdmin || post.authorId === uid;

      if (isAuthor && !canMod && children.length > 0) {
        const ids = collectSubtreeIds(comment.id, comments);
        const allMine = ids.every(
          (id) => comments.find((c) => c.id === id)?.authorId === uid,
        );
        if (!allMine) {
          alert(
            "다른 분이 단 답글이 있어 이 스레드는 글 작성자 또는 관리자만 삭제할 수 있습니다.",
          );
          return;
        }
      }

      const hasReplies = children.length > 0;
      const msg = hasReplies
        ? "이 메시지와 연결된 답글까지 모두 삭제할까요?"
        : "이 메시지를 삭제할까요?";
      if (!confirm(msg)) return;

      setBusyId(comment.id);
      setRootError(null);
      try {
        await deleteCommentTree(comment.id, post.id);
        await refresh();
      } catch (e) {
        console.error(e);
        setRootError("삭제에 실패했습니다.");
      } finally {
        setBusyId(null);
      }
    },
    [user, isAdmin, post.authorId, post.id, comments, byParent, refresh],
  );

  const handleSaveCommentEdit = useCallback(
    async (c: Comment, content: string) => {
      if (!user || user.uid !== c.authorId) return;
      setBusyId(c.id);
      setRootError(null);
      try {
        await updateComment({
          commentId: c.id,
          authorId: user.uid,
          content,
        });
        await refresh();
      } catch (e) {
        console.error(e);
        setRootError("수정에 실패했습니다.");
        throw e;
      } finally {
        setBusyId(null);
      }
    },
    [user, refresh],
  );

  return (
    <section className="border-t border-zinc-200 pt-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Q&A 스레드
          </h2>
        </div>
        <p className="text-xs font-medium text-neutral-500">
          댓글 {comments.length}
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
              onCommentDelete={handleCommentDelete}
              onSaveCommentEdit={handleSaveCommentEdit}
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
