"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/posts";
import { POST_CATEGORIES, REGIONS } from "@/lib/constants";
import { buildShortLessonMarkdown } from "@/lib/shortLesson";
import { useAuth } from "@/providers/AuthProvider";
import { MarkdownContent } from "@/components/MarkdownContent";

type Tab = "edit" | "preview";
type WriteMode = "single" | "sections";

export function WritePostForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [intro, setIntro] = useState("");
  const [core, setCore] = useState("");
  const [closing, setClosing] = useState("");
  const [writeMode, setWriteMode] = useState<WriteMode>("single");
  const [category, setCategory] = useState<string>(POST_CATEGORIES[0]!);
  const [region, setRegion] = useState<string>(REGIONS[0]!);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("edit");

  const combinedBody = useMemo(
    () =>
      writeMode === "sections"
        ? buildShortLessonMarkdown({ intro, core, closing })
        : content,
    [writeMode, content, intro, core, closing],
  );

  function setMode(next: WriteMode) {
    if (next === "single" && writeMode === "sections") {
      const merged = buildShortLessonMarkdown({ intro, core, closing });
      if (merged) setContent(merged);
    }
    setWriteMode(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const body =
      writeMode === "sections"
        ? buildShortLessonMarkdown({ intro, core, closing })
        : content;
    if (!title.trim() || !body.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const id = await createPost({
        title,
        content: body,
        category,
        region,
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
      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-1">
        <div className="flex rounded-md bg-zinc-100/90 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 rounded-md px-2 py-2 sm:py-1.5 ${
              writeMode === "single"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            한 번에 쓰기
          </button>
          <button
            type="button"
            onClick={() => setMode("sections")}
            className={`flex-1 rounded-md px-2 py-2 sm:py-1.5 ${
              writeMode === "sections"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            짧은 문단 3칸
          </button>
        </div>
        <p className="px-2 pb-2 pt-1.5 text-xs text-zinc-600">
          {writeMode === "sections"
            ? "시작·핵심·마무리로 나누어 쓰면 제출 시 자동으로 소제목이 붙습니다."
            : "자유롭게 마크다운으로 작성할 수 있어요."}
        </p>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <label
            htmlFor={writeMode === "single" ? "content" : "section-intro"}
            className="block text-sm font-medium text-zinc-800"
          >
            {writeMode === "sections" ? "본문 (짧은 문단)" : "본문 (마크다운)"}
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
        {tab === "edit" ? (
          writeMode === "single" ? (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-950 placeholder:text-zinc-500"
              placeholder={
                '## 소제목\n\n- 목록\n- **강조**\n\n```\n코드 블록\n```\n\n[링크](https://...)'
              }
            />
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="section-intro"
                  className="mb-1 block text-xs font-medium text-zinc-700"
                >
                  시작하기 (한두 문단)
                </label>
                <textarea
                  id="section-intro"
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
                  placeholder="왜 이 글이 필요한지, 무엇을 다루는지"
                />
              </div>
              <div>
                <label htmlFor="section-core" className="mb-1 block text-xs font-medium text-zinc-700">
                  핵심 정리
                </label>
                <textarea
                  id="section-core"
                  value={core}
                  onChange={(e) => setCore(e.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
                  placeholder="꼭 알아야 할 절차·팁"
                />
              </div>
              <div>
                <label
                  htmlFor="section-closing"
                  className="mb-1 block text-xs font-medium text-zinc-700"
                >
                  팁·마무리 (선택)
                </label>
                <textarea
                  id="section-closing"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500"
                  placeholder="주의할 점, 다음 행동 등"
                />
              </div>
            </div>
          )
        ) : (
          <div className="min-h-[280px] rounded-lg border border-zinc-300 bg-white px-3 py-3">
            {combinedBody.trim() ? (
              <MarkdownContent markdown={combinedBody} />
            ) : (
              <p className="text-sm text-zinc-500">내용을 입력하면 여기에 미리보기가 보입니다.</p>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-zinc-600">
          {writeMode === "single"
            ? "GitHub Flavored Markdown(표, 체크리스트 등)을 지원합니다."
            : "제출 시 «시작하기 / 핵심 정리 / 팁·마무리» 제목이 자동으로 붙습니다. 문단 안에서는 **강조** 등을 쓸 수 있어요."}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-3">
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
