"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/posts";
import { POST_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";

export function WritePostForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(POST_CATEGORIES[0]!);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const id = await createPost({
        title,
        content,
        category,
        authorId: user.uid,
        commentsEnabled,
      });
      router.push(`/posts/${id}`);
    } catch (err) {
      console.error(err);
      setError("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-800">
          카테고리
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
      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-zinc-800">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder:text-zinc-500"
          placeholder="나누고 싶은 내용을 적어 주세요."
        />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-3">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">댓글(질문/답변)</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              OFF로 제출하면 다른 사용자는 댓글을 달 수 없습니다.
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
        제출 후 관리자 승인이 있으면 홈에 공개됩니다.
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-[#ffffff] disabled:opacity-50"
      >
        {submitting ? "보내는 중…" : "제출하기"}
      </button>
    </form>
  );
}
