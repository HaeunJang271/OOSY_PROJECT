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
      setError("글을 불러오지 못했습니다. 환경 변수와 Firestore 규칙을 확인해 주세요.");
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
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-700"
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
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-zinc-500">불러오는 중…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-zinc-600">아직 승인된 글이 없습니다.</p>
      )}

      <ul className="divide-y divide-zinc-100">
        {posts.map((p) => (
          <li key={p.id} className="py-4 first:pt-0">
            <Link href={`/posts/${p.id}`} className="block">
              <span className="mb-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {p.category}
              </span>
              <h2 className="text-base font-medium text-zinc-900">{p.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                {p.content}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {formatDate(p.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
