"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deletePostByAuthor } from "@/lib/posts";

type Props = {
  postId: string;
  authorId: string;
  /** 승인 대기 글만 수정 페이지로 연결 */
  showEdit?: boolean;
  /** 삭제 후 (예: 목록 새로고침, 상세에서 홈 이동) */
  onDeleted?: () => void;
  align?: "left" | "right";
  className?: string;
};

export function PostActionsMenu({
  postId,
  authorId,
  showEdit = true,
  onDeleted,
  align = "right",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }
  }, [open]);

  async function handleDelete() {
    if (
      !confirm(
        "이 글과 Q&A 댓글을 모두 삭제할까요? 되돌릴 수 없습니다.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deletePostByAuthor({ postId, authorId });
      setOpen(false);
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error ? e.message : "삭제에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`relative inline-flex ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={deleting}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-amber-900/90 hover:bg-amber-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:opacity-50"
        aria-label="글 메뉴"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-20 mt-1 min-w-32 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {showEdit && (
            <Link
              role="menuitem"
              href={`/posts/${postId}/edit`}
              className="block px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-100"
              onClick={() => setOpen(false)}
            >
              수정
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            onClick={() => void handleDelete()}
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}
