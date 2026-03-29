"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApprovedPosts } from "@/lib/posts";
import {
  CATEGORY_ALL,
  POST_CATEGORIES,
  REGION_ALL,
  REGIONS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { plainTextExcerpt } from "@/lib/markdown";
import type { Post } from "@/lib/types";

function resolveCategory(raw: string | null): string {
  if (!raw || raw === CATEGORY_ALL) return CATEGORY_ALL;
  if ((POST_CATEGORIES as readonly string[]).includes(raw)) return raw;
  return CATEGORY_ALL;
}

function resolveRegion(raw: string | null): string {
  if (!raw || raw === REGION_ALL) return REGION_ALL;
  if ((REGIONS as readonly string[]).includes(raw)) return raw;
  return REGION_ALL;
}

function isIndexBuildingError(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message?: string }).message)
      : "";
  return msg.includes("currently building") || msg.includes("building and cannot be used");
}

function buildHomePath(parts: { category: string; region: string }): string {
  const params = new URLSearchParams();
  if (parts.category !== CATEGORY_ALL) params.set("category", parts.category);
  if (parts.region !== REGION_ALL) params.set("region", parts.region);
  const q = params.toString();
  return q ? `/?${q}` : "/";
}

export function HomePosts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = useMemo(
    () => resolveCategory(searchParams.get("category")),
    [searchParams],
  );
  const region = useMemo(
    () => resolveRegion(searchParams.get("region")),
    [searchParams],
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function navigateWith(next: { category?: string; region?: string }) {
    const path = buildHomePath({
      category: next.category ?? category,
      region: next.region ?? region,
    });
    router.push(path, { scroll: false });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchApprovedPosts({
        category,
        region,
      });
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
  }, [category, region]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          필터
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="home-filter-category"
              className="mb-1 block text-sm font-medium text-neutral-800"
            >
              주제
            </label>
            <select
              id="home-filter-category"
              value={category}
              onChange={(e) => navigateWith({ category: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
            >
              <option value={CATEGORY_ALL}>{CATEGORY_ALL}</option>
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="home-filter-region"
              className="mb-1 block text-sm font-medium text-neutral-800"
            >
              지역
            </label>
            <select
              id="home-filter-region"
              value={region}
              onChange={(e) => navigateWith({ region: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
            >
              <option value={REGION_ALL}>{REGION_ALL}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading && (
        <p className="text-sm text-neutral-700">불러오는 중…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-neutral-800">아직 승인된 글이 없습니다.</p>
      )}

      {posts.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {posts.map((p) => (
            <li key={p.id} className="px-3 py-4 first:rounded-t-lg last:rounded-b-lg sm:px-4">
              <Link
                href={`/posts/${p.id}`}
                className="block outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                    {p.category}
                  </span>
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
                    {p.region}
                  </span>
                </div>
                <h2 className="text-lg font-semibold leading-snug text-neutral-950">
                  {p.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-800">
                  {plainTextExcerpt(p.content)}
                </p>
                <p className="mt-2 text-xs font-medium text-neutral-600">
                  {formatDate(p.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
