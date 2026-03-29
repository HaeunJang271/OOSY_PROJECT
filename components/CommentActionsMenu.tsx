"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  showEdit?: boolean;
  showDelete?: boolean;
  onEdit?: () => void;
  onDelete: () => void | Promise<void>;
  deleting?: boolean;
  align?: "left" | "right";
  className?: string;
};

export function CommentActionsMenu({
  showEdit = false,
  showDelete = false,
  onEdit,
  onDelete,
  deleting = false,
  align = "right",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
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

  if (!showEdit && !showDelete) {
    return null;
  }

  return (
    <div className={`relative inline-flex ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={deleting}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 disabled:opacity-50"
        aria-label="댓글 메뉴"
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
          className={`absolute top-full z-20 mt-1 min-w-30 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {showEdit && onEdit && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              수정
            </button>
          )}
          {showDelete && (
            <button
              type="button"
              role="menuitem"
              disabled={deleting}
              className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                void onDelete();
              }}
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
