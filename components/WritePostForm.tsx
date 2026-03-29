"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePendingPost } from "@/lib/posts";
import { POST_CATEGORIES, REGIONS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Post } from "@/lib/types";

type Tab = "edit" | "preview";

type Props = {
  mode?: "create" | "edit";
  initialPost?: Post | null;
};

export function WritePostForm({ mode = "create", initialPost = null }: Props) {
  const { user } = useAuth();
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

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4">
      <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-800">
            주제
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder:text-zinc-500"
          >
            {POST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-zinc-800">
            지역
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder:text-zinc-500"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
          <div className="flex rounded-lg border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`rounded-md px-2 py-1 ${
                tab === "edit"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              작성
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`rounded-md px-2 py-1 ${
                tab === "preview"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              미리보기
            </button>
          </div>
        </div>
        <div
          className={`flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white ${
            tab === "edit" || (tab === "preview" && !content.trim())
              ? "h-[20rem]"
              : "min-h-[20rem]"
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
      <p className="text-xs text-zinc-700">
        {mode === "edit"
          ? "승인 전까지 수정할 수 있습니다. 저장 후에도 관리자 승인이 있어야 홈에 공개됩니다."
          : "제출 후 관리자 승인이 있으면 홈에 공개됩니다."}
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-[#ffffff] disabled:opacity-50"
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
