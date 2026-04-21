"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyPosts, fetchPostsByIds } from "@/lib/posts";
import { fetchMyBookmarkedPostIds, fetchMyLikedPostIds } from "@/lib/reactions";
import { fetchMyRootQuestions } from "@/lib/comments";
import { formatDate } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";

type Tab = "posts" | "questions" | "bookmarks" | "likes";
type Props = { userId: string };

function isIndexBuildingError(e: unknown): boolean {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "";
  return msg.includes("currently building") || msg.includes("building and cannot be used");
}

const cardShadow = { boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px" };

function PostList({ list, emptyText }: { list: Post[]; emptyText: string }) {
  return list.length === 0 ? (
    <p className="text-[15px] text-[#1d1d1f]/50">{emptyText}</p>
  ) : (
    <ul className="space-y-2">
      {list.map((p) => (
        <li key={p.id} className="rounded-xl bg-white px-4 py-3.5" style={cardShadow}>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {p.status === "pending" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-[-0.008em] text-amber-700">
                승인 대기
              </span>
            )}
            <span className="text-[12px] tracking-[-0.008em] text-[#1d1d1f]/40">
              {p.category} · {p.region}
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
  );
}

export function MyActivityLists({ userId }: Props) {
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myQuestions, setMyQuestions] = useState<Comment[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsRes, questionsRes, bookmarkIdsRes, likeIdsRes] = await Promise.allSettled([
        fetchMyPosts(userId),
        fetchMyRootQuestions(userId),
        fetchMyBookmarkedPostIds(userId),
        fetchMyLikedPostIds(userId),
      ]);

      const failures: unknown[] = [];

      const posts =
        postsRes.status === "fulfilled"
          ? postsRes.value
          : (failures.push(postsRes.reason), []);
      const questions =
        questionsRes.status === "fulfilled"
          ? questionsRes.value
          : (failures.push(questionsRes.reason), []);
      const bookmarkIds =
        bookmarkIdsRes.status === "fulfilled"
          ? bookmarkIdsRes.value
          : (failures.push(bookmarkIdsRes.reason), []);
      const likeIds =
        likeIdsRes.status === "fulfilled"
          ? likeIdsRes.value
          : (failures.push(likeIdsRes.reason), []);

      const [bookmarkPostsRes, likePostsRes] = await Promise.allSettled([
        fetchPostsByIds(bookmarkIds),
        fetchPostsByIds(likeIds),
      ]);

      const bookmarkPosts =
        bookmarkPostsRes.status === "fulfilled"
          ? bookmarkPostsRes.value
          : (failures.push(bookmarkPostsRes.reason), []);
      const likePosts =
        likePostsRes.status === "fulfilled"
          ? likePostsRes.value
          : (failures.push(likePostsRes.reason), []);

      setMyPosts(posts);
      setMyQuestions(questions);
      setBookmarks(bookmarkPosts);
      setLikes(likePosts);

      if (failures.length > 0) {
        failures.forEach((f) => console.error(f));
        const hasIndexError = failures.some((f) => isIndexBuildingError(f));
        setError(
          hasIndexError
            ? "일부 활동은 인덱스 생성 중이라 불러오지 못했습니다. 잠시 후 새로고침해 주세요."
            : "일부 활동을 불러오지 못했습니다.",
        );
      }
    } catch (e) {
      console.error(e);
      setError(
        isIndexBuildingError(e)
          ? "인덱스 생성 중입니다. 잠시 후 새로고침해 주세요."
          : "내 활동 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "posts", label: "내 글", count: myPosts.length },
    { key: "questions", label: "질문", count: myQuestions.length },
    { key: "bookmarks", label: "북마크", count: bookmarks.length },
    { key: "likes", label: "좋아요", count: likes.length },
  ];

  return (
    <section className="mt-8">
      {/* 탭 */}
      <div
        className="mb-5 flex rounded-full p-0.5"
        style={{ background: "rgba(0,0,0,0.06)" }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-full px-2 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition-all ${
              tab === key ? "btn-glass text-[#1d1d1f]" : "text-[#1d1d1f]/50 hover:text-[#1d1d1f]/80"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {loading && <p className="text-[15px] text-[#1d1d1f]/50">불러오는 중…</p>}
      {error && <p className="text-[15px] text-red-500">{error}</p>}

      {!loading && !error && tab === "posts" && <PostList list={myPosts} emptyText="작성한 글이 없습니다." />}

      {!loading && !error && tab === "questions" && (
        myQuestions.length === 0 ? (
          <p className="text-[15px] text-[#1d1d1f]/50">작성한 질문이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {myQuestions.map((q) => (
              <li key={q.id} className="rounded-xl bg-white px-4 py-3.5" style={cardShadow}>
                <p className="text-[15px] tracking-[-0.016em] text-[#1d1d1f]">{q.content}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[12px] tracking-[-0.008em] text-[#1d1d1f]/40">{formatDate(q.createdAt)}</p>
                  <Link href={`/posts/${q.postId}`} className="text-[12px] font-medium tracking-[-0.008em] text-[#0071e3]">
                    글 보기
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {!loading && !error && tab === "bookmarks" && <PostList list={bookmarks} emptyText="북마크한 글이 없습니다." />}
      {!loading && !error && tab === "likes" && <PostList list={likes} emptyText="좋아요한 글이 없습니다." />}
    </section>
  );
}
