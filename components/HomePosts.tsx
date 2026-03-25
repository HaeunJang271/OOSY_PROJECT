"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedPosts } from "@/lib/posts";
import { CATEGORY_ALL, POST_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";

function resolveCategory(raw: string | null): string {
  if (!raw || raw === CATEGORY_ALL) return CATEGORY_ALL;
  if ((POST_CATEGORIES as readonly string[]).includes(raw)) return raw;
  return CATEGORY_ALL;
}

function isIndexBuildingError(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message?: string }).message)
      : "";
  return msg.includes("currently building") || msg.includes("building and cannot be used");
}

export function HomePosts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = useMemo(
    () => resolveCategory(searchParams.get("category")),
    [searchParams],
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function setCategoryAndUrl(next: string) {
    if (next === CATEGORY_ALL) {
      router.push("/", { scroll: false });
    } else {
      router.push(`/?category=${encodeURIComponent(next)}`, { scroll: false });
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cat =
        category === CATEGORY_ALL ? undefined : category;
      const list = await fetchApprovedPosts(cat);
      setPosts(list);
    } catch (e) {
      console.error(e);
      if (isIndexBuildingError(e)) {
        setError(
          "Firestore 인덱스가 아직 생성 중입니다. 콘솔의 인덱스 탭에서 상태가 ‘사용 가능’이 될 때까지(보통 수 분) 기다린 뒤 새로고침해 주세요.",
        );
      } else {
        setError("글을 불러오지 못했습니다. 환경 변수와 Firestore 규칙·인덱스를 확인해 주세요.");
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryAndUrl(CATEGORY_ALL)}
          className={`rounded-full border px-3 py-1.5 text-sm ${
            category === CATEGORY_ALL
              ? "border-zinc-900 bg-zinc-900 text-[#ffffff]"
              : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          {CATEGORY_ALL}
        </button>
        {POST_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryAndUrl(c)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              category === c
                ? "border-zinc-900 bg-zinc-900 text-[#ffffff]"
                : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-neutral-700">불러오는 중…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-neutral-800">아직 승인된 글이 없습니다.</p>
      )}

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        {posts.map((p) => (
          <li key={p.id} className="px-3 py-4 first:rounded-t-lg last:rounded-b-lg sm:px-4">
            <Link
              href={`/posts/${p.id}`}
              className="block outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <span className="mb-1.5 inline-block rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                {p.category}
              </span>
              <h2 className="text-lg font-semibold leading-snug text-neutral-950">
                {p.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-800">
                {p.content}
              </p>
              <p className="mt-2 text-xs font-medium text-neutral-600">
                {formatDate(p.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
