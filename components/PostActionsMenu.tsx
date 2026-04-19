"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deletePostByAuthor } from "@/lib/posts";
import { REPORT_TYPES, submitPostReport, type ReportType } from "@/lib/reports";

type Props = {
  postId: string;
  authorId: string;
  /** 승인 대기 글만 수정 페이지로 연결 */
  showEdit?: boolean;
  /** 글 작성자일 때만 삭제 허용 */
  canDelete?: boolean;
  /** 메뉴에 신고 노출 여부 */
  showReport?: boolean;
  /** 신고 시 로그인 사용자 uid */
  reporterId?: string;
  /** 점 3개 트리거 버튼만 스타일 커스터마이징 */
  triggerClassName?: string;
  /** 삭제 후 (예: 목록 새로고침, 상세에서 홈 이동) */
  onDeleted?: () => void;
  /** 신고 후 처리 (예: 목록 재조회, 상세 닫기) */
  onReported?: () => void;
  align?: "left" | "right";
  className?: string;
};

export function PostActionsMenu({
  postId,
  authorId,
  showEdit = true,
  canDelete = true,
  showReport = false,
  reporterId,
  triggerClassName,
  onDeleted,
  onReported,
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

  async function handleReport() {
    if (!reporterId) {
      alert("신고하려면 로그인해 주세요.");
      return;
    }
    const options = REPORT_TYPES.map((t, i) => `${i + 1}. ${t}`).join("\n");
    const picked = window.prompt(
      `신고 유형을 선택해 주세요.\n${options}\n\n번호를 입력해 주세요.`,
    );
    if (!picked) return;
    const idx = Number.parseInt(picked, 10) - 1;
    if (!Number.isFinite(idx) || idx < 0 || idx >= REPORT_TYPES.length) {
      alert("올바른 번호를 입력해 주세요.");
      return;
    }
    const reportType = REPORT_TYPES[idx] as ReportType;
    if (!confirm(`"${reportType}" 유형으로 신고할까요?`)) return;
    try {
      await submitPostReport({ postId, reporterId, reportType });
      setOpen(false);
      alert("신고가 접수되었습니다.");
      onReported?.();
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "신고에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return (
    <div className={`relative inline-flex ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={deleting}
        className={`btn-glass flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#1d1d1f]/50 hover:text-[#1d1d1f]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:opacity-50 ${triggerClassName ?? ""}`}
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
          className={`absolute top-full z-20 mt-1 min-w-32 overflow-hidden rounded-xl py-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95)" }}
        >
          {showEdit && (
            <Link
              role="menuitem"
              href={`/posts/${postId}/edit`}
              className="block px-4 py-2.5 text-[14px] tracking-[-0.016em] text-[#1d1d1f] hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}
            >
              수정
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              role="menuitem"
              disabled={deleting}
              className="w-full px-4 py-2.5 text-left text-[14px] tracking-[-0.016em] text-red-500 hover:bg-red-500/[0.06] disabled:opacity-50"
              onClick={() => void handleDelete()}
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          {showReport && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-[14px] tracking-[-0.016em] text-[#1d1d1f] hover:bg-black/[0.04]"
              onClick={() => void handleReport()}
            >
              신고
            </button>
          )}
        </div>
      )}
    </div>
  );
}
