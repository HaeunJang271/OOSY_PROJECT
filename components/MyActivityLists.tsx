"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyPosts, fetchPostsByIds } from "@/lib/posts";
import {
  fetchMyBookmarkedPostIds,
  fetchMyLikedPostIds,
} from "@/lib/reactions";
import { fetchMyRootQuestions } from "@/lib/comments";
import { formatDate } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";

type Tab = "posts" | "questions" | "bookmarks" | "likes";

type Props = {
  userId: string;
};

function isIndexBuildingError(e: unknown): boolean {
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message?: string }).message)
      : "";
  return msg.includes("currently building") || msg.includes("building and cannot be used");
}

function PostList({
  title,
  list,
  emptyText,
}: {
  title: string;
  list: Post[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
      {list.length === 0 ? (
        <p className="text-sm text-neutral-700">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {list.map((p) => (
            <li key={p.id} className="px-3 py-3.5 sm:px-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {p.status === "pending" && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                    승인 대기
                  </span>
                )}
                <span className="text-xs text-neutral-500">
                  {p.category} · {p.region}
                </span>
              </div>
              <Link
                href={`/posts/${p.id}`}
                className="block font-medium text-neutral-950 hover:underline"
              >
                {p.title}
              </Link>
              <p className="mt-1.5 text-xs text-neutral-500">{formatDate(p.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
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
      const [posts, questions, bookmarkIds, likeIds] = await Promise.all([
        fetchMyPosts(userId),
        fetchMyRootQuestions(userId),
        fetchMyBookmarkedPostIds(userId),
        fetchMyLikedPostIds(userId),
      ]);
      const [bookmarkPosts, likePosts] = await Promise.all([
        fetchPostsByIds(bookmarkIds),
        fetchPostsByIds(likeIds),
      ]);
      setMyPosts(posts);
      setMyQuestions(questions);
      setBookmarks(bookmarkPosts);
      setLikes(likePosts);
    } catch (e) {
      console.error(e);
      if (isIndexBuildingError(e)) {
        setError(
          "Firestore 인덱스가 아직 생성 중입니다. 잠시 후 새로고침해 주세요.",
        );
      } else {
        setError("내 활동 목록을 불러오지 못했습니다.");
      }
      setMyPosts([]);
      setMyQuestions([]);
      setBookmarks([]);
      setLikes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-zinc-300 bg-zinc-100/80 p-1 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "posts" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-800"
          }`}
        >
          내 글 ({myPosts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("questions")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "questions" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-800"
          }`}
        >
          내 질문 ({myQuestions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("bookmarks")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "bookmarks" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-800"
          }`}
        >
          북마크 ({bookmarks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("likes")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "likes" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-800"
          }`}
        >
          좋아요 ({likes.length})
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-700">불러오는 중…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && tab === "posts" && (
        <PostList title="내 글" list={myPosts} emptyText="작성한 글이 없습니다." />
      )}
      {!loading && !error && tab === "questions" && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-950">내 질문</h3>
          {myQuestions.length === 0 ? (
            <p className="text-sm text-neutral-700">작성한 질문이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {myQuestions.map((q) => (
                <li key={q.id} className="px-3 py-3.5 sm:px-4">
                  <p className="text-sm text-neutral-900">{q.content}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500">{formatDate(q.createdAt)}</p>
                    <Link
                      href={`/posts/${q.postId}`}
                      className="text-xs font-medium text-neutral-900 underline"
                    >
                      글 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {!loading && !error && tab === "bookmarks" && (
        <PostList
          title="북마크"
          list={bookmarks}
          emptyText="북마크한 글이 없습니다."
        />
      )}
      {!loading && !error && tab === "likes" && (
        <PostList title="좋아요" list={likes} emptyText="좋아요한 글이 없습니다." />
      )}
    </section>
  );
}
