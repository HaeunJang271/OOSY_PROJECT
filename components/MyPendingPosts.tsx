"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyPendingPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";
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
      if (isIndexBuildingError(e)) {
        setError(
          "Firestore 인덱스가 아직 생성 중입니다. 콘솔 인덱스 탭에서 ‘사용 가능’이 될 때까지(보통 수 분) 기다린 뒤 새로고침해 주세요.",
        );
      } else {
        setError("목록을 불러오지 못했습니다.");
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [authorId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6">
      <h2 className="text-base font-semibold text-neutral-950">승인 대기 중인 글</h2>
      <p className="mt-1 text-xs text-neutral-600">
        관리자 승인 전까지 홈 목록에는 나오지 않습니다. 제목을 눌러 내용을 확인할 수 있어요.
      </p>

      {loading && (
        <p className="mt-4 text-sm text-neutral-700">불러오는 중…</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}
      {!loading && !error && posts.length === 0 && (
        <p className="mt-4 text-sm text-neutral-700">승인 대기 중인 글이 없습니다.</p>
      )}
      {!loading && !error && posts.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/posts/${p.id}`}
                className="block px-3 py-3.5 transition-colors hover:bg-zinc-50 sm:px-4"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                    승인 대기
                  </span>
                  <span className="text-xs text-neutral-500">
                    {p.category} · {p.region}
                  </span>
                </div>
                <p className="font-medium text-neutral-950">{p.title}</p>
                <p className="mt-1.5 text-xs text-neutral-500">
                  {formatDate(p.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
