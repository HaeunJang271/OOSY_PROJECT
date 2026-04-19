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
import { formatDate, shortUid } from "@/lib/format";
import { fetchNicknamesByUids } from "@/lib/profile";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { useAuth } from "@/providers/AuthProvider";
import { fetchMyReportedPostIds } from "@/lib/reports";
import type { Post } from "@/lib/types";

function resolveCategory(raw: string | null): string {
  if (!raw || raw === CATEGORY_ALL) return CATEGORY_ALL;
  if ((POST_CATEGORIES as readonly string[]).includes(raw)) return raw;
  return CATEGORY_ALL;
}

function resolveRegion(raw: string | null): string {
  const REGION_HOME_ALL = REGIONS[0];
  if (!raw) return REGION_HOME_ALL;
  if (raw === REGION_ALL) return REGION_HOME_ALL;
  if ((REGIONS as readonly string[]).includes(raw)) return raw;
  return REGION_HOME_ALL;
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
  const REGION_HOME_ALL = REGIONS[0];
  if (parts.region !== REGION_HOME_ALL) params.set("region", parts.region);
  const q = params.toString();
  return q ? `/?${q}` : "/";
}

export function HomePosts() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const category = useMemo(
    () => {
      const raw = searchParams.get("category");
      if (!isAdmin && raw === "공지") return CATEGORY_ALL;
      return resolveCategory(raw);
    },
    [searchParams, isAdmin],
  );
  const region = useMemo(
    () => resolveRegion(searchParams.get("region")),
    [searchParams],
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});
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
      const list = await fetchApprovedPosts({ category, region });
      const hiddenIds = user?.uid
        ? await fetchMyReportedPostIds(user.uid)
        : new Set<string>();
      const visible = list.filter((p) => !hiddenIds.has(p.id));
      setPosts(visible);
      if (visible.length > 0) {
        const uids = [...new Set(visible.map((p) => p.authorId).filter(Boolean))];
        try {
          const map = await fetchNicknamesByUids(uids);
          setNicknameByUid(map);
        } catch {
          setNicknameByUid({});
        }
      } else {
        setNicknameByUid({});
      }
    } catch (e) {
      console.error(e);
      if (isIndexBuildingError(e)) {
        setError("Firestore 인덱스가 생성 중입니다. 잠시 후 새로고침해 주세요.");
      } else {
        setError("글을 불러오지 못했습니다.");
      }
      setPosts([]);
      setNicknameByUid({});
    } finally {
      setLoading(false);
    }
  }, [category, region, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const selectClass = "w-full appearance-none rounded-[11px] border-[3px] border-black/[0.04] bg-[#fafafc] px-3 py-2 pr-8 text-[15px] text-[#1d1d1f] tracking-[-0.016em] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30";

  return (
    <div className="space-y-5">
      {/* 필터 */}
      <section className="rounded-xl bg-white px-4 py-4" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px" }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d1d1f]/40">
          필터
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="home-filter-category" className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]/70 tracking-[-0.012em]">
              주제
            </label>
            <div className="relative">
              <select
                id="home-filter-category"
                value={category}
                onChange={(e) => navigateWith({ category: e.target.value })}
                className={selectClass}
              >
                <option value={CATEGORY_ALL}>{CATEGORY_ALL}</option>
                {(isAdmin ? POST_CATEGORIES : POST_CATEGORIES.filter((c) => c !== "공지")).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#1d1d1f]/40">
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7.5L10 12.5L15 7.5" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="home-filter-region" className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]/70 tracking-[-0.012em]">
              지역
            </label>
            <div className="relative">
              <select
                id="home-filter-region"
                value={region}
                onChange={(e) => navigateWith({ region: e.target.value })}
                className={selectClass}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#1d1d1f]/40">
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7.5L10 12.5L15 7.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <p className="text-[15px] text-[#1d1d1f]/50 tracking-[-0.016em]">불러오는 중…</p>
      )}
      {error && (
        <p className="text-[15px] text-red-500 tracking-[-0.016em]">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="py-5 text-center">
          <p className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.022em]">아직 글이 없어요</p>
          <p className="mt-1.5 text-[14px] text-[#1d1d1f]/50 tracking-[-0.016em]">
            홈에 첫 번째 글을 작성해 보세요
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="space-y-2.5">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-xl bg-white px-4 py-4"
              style={{ boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-semibold tracking-[-0.008em] text-[#1d1d1f]/70">
                    {p.category}
                  </span>
                  <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-[-0.008em] text-[#0071e3]">
                    {p.region}
                  </span>
                </div>
                <PostActionsMenu
                  postId={p.id}
                  authorId={p.authorId}
                  showEdit={false}
                  canDelete={Boolean(user?.uid === p.authorId)}
                  showReport
                  reporterId={user?.uid}
                  onDeleted={() => void load()}
                  onReported={() => void load()}
                  triggerClassName="h-5 w-5 text-[#1d1d1f]/40 hover:text-[#1d1d1f]/70"
                />
              </div>
              <Link
                href={`/posts/${p.id}`}
                className="block outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] rounded-lg"
              >
                <h2 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.022em] text-[#1d1d1f]">
                  {p.title}
                </h2>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[12px] tracking-[-0.008em] text-[#1d1d1f]/40">{formatDate(p.createdAt)}</span>
                  <span className="text-[12px] tracking-[-0.008em] text-[#1d1d1f]/50">
                    {nicknameByUid[p.authorId] ?? shortUid(p.authorId)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
