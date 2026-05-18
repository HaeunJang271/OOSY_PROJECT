"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 헤더에서 검색어 입력 후 ‘검색’을 누르면 `/search?q=…`로 이동합니다. */
export function HeaderSearchPanel({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) {
      setInput("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      alert("검색어를 입력해 주세요.");
      return;
    }
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  if (!open) return null;

  return (
    <div
      id="header-search-panel"
      className="absolute left-0 right-0 top-full z-20 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface)]"
      style={{ boxShadow: "var(--shadow-card)" }}
      role="search"
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl px-5 pb-5 pt-4"
      >
<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제목·본문에서 검색"
            className="input-field-plain min-w-0 flex-1 text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary shrink-0 w-auto px-5 py-2.5 text-sm"
          >
            검색
          </button>
        </div>
      </form>
    </div>
  );
}
