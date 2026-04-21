"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, setPostStatus, updatePendingPost } from "@/lib/posts";
import { POST_CATEGORIES, REGIONS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Post } from "@/lib/types";

type Tab = "edit" | "preview";

function WriteFormSelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-500">
      <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 7.5L10 12.5L15 7.5" />
      </svg>
    </span>
  );
}

type Props = {
  mode?: "create" | "edit";
  initialPost?: Post | null;
};

export function WritePostForm({ mode = "create", initialPost = null }: Props) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(POST_CATEGORIES[0]!);
  const [region, setRegion] = useState<string>(REGIONS[0]!);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("edit");

  useEffect(() => {
    if (mode !== "edit" || !initialPost) return;
    setTitle(initialPost.title);
    setContent(initialPost.content);
    setCategory(initialPost.category);
    setRegion(initialPost.region);
    setCommentsEnabled(initialPost.commentsEnabled ?? true);
  }, [mode, initialPost]);

  useEffect(() => {
    // 관리자가 아니면 공지 카테고리를 선택할 수 없음
    if (!isAdmin && category === "공지") {
      setCategory("강좌");
    }
  }, [isAdmin, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "edit" && initialPost) {
        await updatePendingPost({
          postId: initialPost.id,
          title,
          content,
          category,
          region,
          authorId: user.uid,
          commentsEnabled,
        });
        router.push(`/posts/${initialPost.id}`);
        router.refresh();
      } else {
        const id = await createPost({
          title,
          content,
          category,
          region,
          authorId: user.uid,
          commentsEnabled,
          status: isAdmin && category === "공지" ? "approved" : undefined,
        });
        router.push(`/posts/${id}`);
      }
    } catch (err) {
      console.error(err);
      setError(
        mode === "edit"
          ? "수정 저장에 실패했습니다."
          : "저장에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  const categoryOptions = isAdmin
    ? POST_CATEGORIES
    : POST_CATEGORIES.filter((c) => c !== "공지");

  const selectClass =
    "w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-11 text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10";

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4">
      <div className="grid w-full min-w-0 grid-cols-1 gap-4">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-800">
            주제
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <WriteFormSelectChevron />
          </div>
        </div>
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-zinc-800">
            지역
          </label>
          <div className="relative">
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={selectClass}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <WriteFormSelectChevron />
          </div>
        </div>
      </div>
      <div className="w-full min-w-0">
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-800">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder:text-zinc-500"
          placeholder="짧은 강좌·정보 글 제목"
          maxLength={200}
        />
      </div>
      <div className="w-full min-w-0">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="content" className="block text-sm font-medium text-zinc-800">
            본문
          </label>
          <div className="flex rounded-full p-0.5 text-xs font-medium" style={{ background: "rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`rounded-full px-3 py-1 text-[12px] font-medium tracking-[-0.01em] transition-all ${
                tab === "edit"
                  ? "btn-glass text-[#1d1d1f]"
                  : "text-[#1d1d1f]/50 hover:text-[#1d1d1f]/80"
              }`}
            >
              작성
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`rounded-full px-3 py-1 text-[12px] font-medium tracking-[-0.01em] transition-all ${
                tab === "preview"
                  ? "btn-glass text-[#1d1d1f]"
                  : "text-[#1d1d1f]/50 hover:text-[#1d1d1f]/80"
              }`}
            >
              미리보기
            </button>
          </div>
        </div>
        <div
          className={`flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white ${
            tab === "edit" || (tab === "preview" && !content.trim())
              ? "h-80"
              : "min-h-80"
          }`}
        >
          {tab === "edit" ? (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-0 w-full flex-1 resize-y appearance-none border-0 bg-transparent px-4 py-4 font-sans text-base leading-[1.8] tracking-normal text-neutral-950 outline-none [scrollbar-gutter:stable] placeholder:text-zinc-500 focus:outline-none focus:ring-0"
              placeholder="내용을 입력해 주세요."
            />
          ) : (
            <div className="min-h-0 w-full flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
              {content.trim() ? (
                <MarkdownContent markdown={content} className="markdown-content" />
              ) : (
                <p className="m-0 font-sans text-base leading-[1.8] tracking-normal text-zinc-500">
                  내용을 입력하면 여기에 미리보기가 보입니다.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-3">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">Q&A 스레드</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              OFF면 질문·답글을 달 수 없습니다.
            </p>
          </div>
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => setCommentsEnabled(e.target.checked)}
            className="h-5 w-5 accent-zinc-900"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mode === "edit" && (
        <p className="text-[13px] tracking-[-0.012em] text-[#1d1d1f]/50">
          승인 전까지 수정할 수 있습니다.
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#1d1d1f] py-3.5 text-[15px] font-medium text-white tracking-[-0.016em] hover:bg-black active:bg-[#1d1d1f]/80 disabled:opacity-50"
      >
        {submitting
          ? mode === "edit"
            ? "저장 중…"
            : "보내는 중…"
          : mode === "edit"
            ? "수정 저장"
            : "제출하기"}
      </button>
    </form>
  );
}
