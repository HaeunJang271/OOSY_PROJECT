"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyPendingPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import type { Post } from "@/lib/types";

function isIndexBuildingError(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message?: string }).message)
      : "";
  return msg.includes("currently building") || msg.includes("building and cannot be used");
}

type Props = { authorId: string };

export function MyPendingPosts({ authorId }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMyPendingPosts(authorId);
      setPosts(list);
    } catch (e) {
      console.error(e);
      setError(isIndexBuildingError(e) ? "인덱스 생성 중입니다. 잠시 후 새로고침해 주세요." : "목록을 불러오지 못했습니다.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [authorId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="mt-8">
      <h2 className="mb-1 text-[17px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">승인 대기 중인 글</h2>
      <p className="mb-4 text-[13px] tracking-[-0.012em] text-[#1d1d1f]/50">
        관리자 승인 전까지 홈 목록에 나오지 않습니다.
      </p>

      {loading && <p className="text-[15px] text-[#1d1d1f]/50">불러오는 중…</p>}
      {error && <p className="text-[15px] text-red-500">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="text-[15px] text-[#1d1d1f]/50">승인 대기 중인 글이 없습니다.</p>
      )}
      {!loading && !error && posts.length > 0 && (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-xl bg-white px-4 py-3.5"
              style={{ boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px" }}
            >
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] tracking-[-0.008em] text-[#1d1d1f]/40">
                  {p.category} · {p.region}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-[-0.008em] text-amber-700">
                    승인 대기
                  </span>
                  <PostActionsMenu postId={p.id} authorId={authorId} onDeleted={() => void load()} />
                </span>
              </div>
              <Link
                href={`/posts/${p.id}`}
                className="block text-[15px] font-medium tracking-[-0.016em] text-[#1d1d1f] hover:text-[#0071e3]"
              >
                {p.title}
              </Link>
              <p className="mt-1.5 text-[12px] tracking-[-0.008em] text-[#1d1d1f]/40">{formatDate(p.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
