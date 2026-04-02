"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchApprovedPosts,
  filterPostsBySearchQuery,
} from "@/lib/posts";
import { formatDate, shortUid } from "@/lib/format";
import { fetchNicknamesByUids } from "@/lib/profile";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { useAuth } from "@/providers/AuthProvider";
import { fetchMyReportedPostIds } from "@/lib/reports";
import type { Post } from "@/lib/types";

function isIndexBuildingError(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message?: string }).message)
      : "";
  return (
    msg.includes("currently building") || msg.includes("building and cannot be used")
  );
}

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const { user } = useAuth();

  const [input, setInput] = useState(q);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nicknameByUid, setNicknameByUid] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(() => Boolean(q));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!q) {
      setPosts([]);
      setNicknameByUid({});
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchApprovedPosts({});
      const hiddenIds = user?.uid
        ? await fetchMyReportedPostIds(user.uid)
        : new Set<string>();
      const visible = list.filter((p) => !hiddenIds.has(p.id));
      const matched = filterPostsBySearchQuery(visible, q);
      setPosts(matched);
      if (matched.length > 0) {
        const uids = [...new Set(matched.map((p) => p.authorId).filter(Boolean))];
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
        setError(
          "Firestore 인덱스가 아직 생성 중입니다. 콘솔의 인덱스 탭에서 상태가 ‘사용 가능’이 될 때까지(보통 수 분) 기다린 뒤 새로고침해 주세요.",
        );
      } else {
        setError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setPosts([]);
      setNicknameByUid({});
    } finally {
      setLoading(false);
    }
  }, [q, user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
        role="search"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제목·본문에서 검색"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
            autoComplete="off"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            검색
          </button>
        </div>
      </form>

      {loading && <p className="text-sm text-neutral-700">검색 중…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && q && posts.length === 0 && (
        <p className="text-sm text-neutral-800">검색 결과가 없습니다.</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {posts.map((p) => (
            <li key={p.id} className="px-3 py-4 first:rounded-t-lg last:rounded-b-lg sm:px-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                    {p.category}
                  </span>
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
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
                  triggerClassName="h-5 w-5 text-zinc-600 hover:bg-zinc-100"
                />
              </div>
              <Link
                href={`/posts/${p.id}`}
                className="block outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <h2 className="text-lg font-semibold leading-snug text-neutral-950">
                  {p.title}
                </h2>
                <div className="mt-2 flex items-baseline justify-between gap-2 text-xs font-medium text-neutral-600">
                  <span className="min-w-0 shrink">{formatDate(p.createdAt)}</span>
                  <span className="shrink-0 text-right text-neutral-700">
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
